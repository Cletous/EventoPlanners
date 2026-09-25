import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

function unauthorized(authentication) {
  return NextResponse.json(
    { success: false, message: authentication.message },
    { status: authentication.status },
  );
}

export async function GET(request) {
  const authentication = authenticateRequest(request, ['user']);
  if (!authentication.ok) return unauthorized(authentication);

  const userId = Number(authentication.payload.sub);

  try {
    const [[registrationSummary]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'confirmed') AS confirmed,
         SUM(status = 'pending_payment') AS pending_payment,
         SUM(status = 'cancelled') AS cancelled
       FROM registrations
       WHERE user_id = ?`,
      [userId],
    );

    const [[paymentSummary]] = await pool.execute(
      `SELECT
         COUNT(p.id) AS total,
         SUM(p.status = 'paid') AS paid,
         SUM(p.status = 'pending') AS pending,
         SUM(p.status = 'failed') AS failed,
         COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS paid_amount
       FROM payments p
       INNER JOIN registrations r ON r.id = p.registration_id
       WHERE r.user_id = ?`,
      [userId],
    );

    const [upcomingRegistrations] = await pool.execute(
      `SELECT
         r.id AS registration_id, r.status AS registration_status,
         e.id AS event_id, e.title, e.venue, e.event_date, e.start_time
       FROM registrations r
       INNER JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ?
         AND r.status = 'confirmed'
         AND e.event_date >= CURDATE()
       ORDER BY e.event_date ASC, e.start_time ASC, e.id ASC
       LIMIT 5`,
      [userId],
    );

    const [pendingRegistrations] = await pool.execute(
      `SELECT
         r.id AS registration_id,
         e.id AS event_id, e.title, e.event_date, e.registration_fee,
         p.reference AS latest_payment_reference,
         p.status AS latest_payment_status
       FROM registrations r
       INNER JOIN events e ON e.id = r.event_id
       LEFT JOIN payments p ON p.id = (
         SELECT p2.id
         FROM payments p2
         WHERE p2.registration_id = r.id
         ORDER BY p2.id DESC
         LIMIT 1
       )
       WHERE r.user_id = ? AND r.status = 'pending_payment'
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 5`,
      [userId],
    );

    return NextResponse.json({
      success: true,
      dashboard: {
        registrations: {
          total: Number(registrationSummary.total || 0),
          confirmed: Number(registrationSummary.confirmed || 0),
          pending_payment: Number(registrationSummary.pending_payment || 0),
          cancelled: Number(registrationSummary.cancelled || 0),
        },
        payments: {
          total: Number(paymentSummary.total || 0),
          paid: Number(paymentSummary.paid || 0),
          pending: Number(paymentSummary.pending || 0),
          failed: Number(paymentSummary.failed || 0),
          paid_amount: Number(paymentSummary.paid_amount || 0),
        },
        upcoming_registrations: upcomingRegistrations,
        pending_registrations: pendingRegistrations,
      },
    });
  } catch (error) {
    console.error('Unable to load attendee dashboard:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load dashboard statistics right now.' },
      { status: 500 },
    );
  }
}
