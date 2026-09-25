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

const allowedStatuses = new Set(['pending_payment', 'confirmed', 'cancelled']);

export async function GET(request) {
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) return unauthorized(authentication);

  try {
    const search = request.nextUrl.searchParams.get('search')?.trim() || '';
    const status = request.nextUrl.searchParams.get('status')?.trim() || '';
    const conditions = [];
    const values = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR e.title LIKE ? OR e.venue LIKE ?)');
      values.push(pattern, pattern, pattern, pattern);
    }

    if (status && allowedStatuses.has(status)) {
      conditions.push('r.status = ?');
      values.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [registrations] = await pool.execute(
      `SELECT
         r.id, r.user_id, r.event_id, r.status, r.created_at, r.updated_at,
         u.name AS user_name, u.email AS user_email,
         e.title AS event_title, e.venue AS event_venue,
         e.event_date, e.start_time, e.registration_fee, e.status AS event_status,
         COUNT(p.id) AS payment_attempt_count,
         SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) AS paid_payment_count,
         latest.reference AS latest_payment_reference,
         latest.paynow_reference AS latest_paynow_reference,
         latest.status AS latest_payment_status,
         latest.amount AS latest_payment_amount,
         latest.created_at AS latest_payment_created_at,
         (latest.poll_url IS NOT NULL AND latest.poll_url <> '') AS latest_payment_pollable
       FROM registrations r
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN events e ON e.id = r.event_id
       LEFT JOIN payments p ON p.registration_id = r.id
       LEFT JOIN payments latest ON latest.id = (
         SELECT p2.id
         FROM payments p2
         WHERE p2.registration_id = r.id
         ORDER BY p2.id DESC
         LIMIT 1
       )
       ${whereClause}
       GROUP BY
         r.id, r.user_id, r.event_id, r.status, r.created_at, r.updated_at,
         u.name, u.email,
         e.title, e.venue, e.event_date, e.start_time, e.registration_fee, e.status,
         latest.reference, latest.paynow_reference, latest.status, latest.amount,
         latest.created_at, latest.poll_url
       ORDER BY r.created_at DESC, r.id DESC`,
      values,
    );

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('Unable to load administrator registrations:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load registrations right now.' },
      { status: 500 },
    );
  }
}
