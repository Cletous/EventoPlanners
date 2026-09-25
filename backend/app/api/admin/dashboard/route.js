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
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) return unauthorized(authentication);

  try {
    const [[eventSummary]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'published') AS published,
         SUM(status = 'draft') AS draft,
         SUM(status = 'closed') AS closed,
         SUM(status = 'published' AND event_date >= CURDATE()) AS upcoming
       FROM events`,
    );

    const [[registrationSummary]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'confirmed') AS confirmed,
         SUM(status = 'pending_payment') AS pending_payment,
         SUM(status = 'cancelled') AS cancelled
       FROM registrations`,
    );

    const [[paymentSummary]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'paid') AS paid,
         SUM(status = 'pending') AS pending,
         SUM(status = 'failed') AS failed,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount
       FROM payments`,
    );

    const [recentRegistrations] = await pool.execute(
      `SELECT
         r.id, r.status, r.created_at,
         u.name AS user_name, u.email AS user_email,
         e.id AS event_id, e.title AS event_title, e.event_date
       FROM registrations r
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN events e ON e.id = r.event_id
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 5`,
    );

    const [upcomingEvents] = await pool.execute(
      `SELECT
         e.id, e.title, e.venue, e.event_date, e.start_time, e.capacity,
         COUNT(CASE WHEN r.status <> 'cancelled' THEN 1 END) AS registration_count
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       WHERE e.status = 'published' AND e.event_date >= CURDATE()
       GROUP BY e.id
       ORDER BY e.event_date ASC, e.start_time ASC, e.id ASC
       LIMIT 5`,
    );

    return NextResponse.json({
      success: true,
      dashboard: {
        events: {
          total: Number(eventSummary.total || 0),
          published: Number(eventSummary.published || 0),
          draft: Number(eventSummary.draft || 0),
          closed: Number(eventSummary.closed || 0),
          upcoming: Number(eventSummary.upcoming || 0),
        },
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
        recent_registrations: recentRegistrations,
        upcoming_events: upcomingEvents,
      },
    });
  } catch (error) {
    console.error('Unable to load administrator dashboard:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load dashboard statistics right now.' },
      { status: 500 },
    );
  }
}
