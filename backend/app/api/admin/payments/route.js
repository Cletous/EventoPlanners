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

const allowedStatuses = new Set(['pending', 'paid', 'failed']);

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
      conditions.push(`(
        u.name LIKE ? OR u.email LIKE ? OR e.title LIKE ? OR
        p.reference LIKE ? OR p.paynow_reference LIKE ?
      )`);
      values.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (status && allowedStatuses.has(status)) {
      conditions.push('p.status = ?');
      values.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [payments] = await pool.execute(
      `SELECT
         p.id, p.registration_id, p.amount, p.reference, p.paynow_reference,
         p.status, p.created_at, p.updated_at,
         (p.poll_url IS NOT NULL AND p.poll_url <> '') AS can_poll,
         r.status AS registration_status,
         u.id AS user_id, u.name AS user_name, u.email AS user_email,
         e.id AS event_id, e.title AS event_title, e.event_date, e.start_time
       FROM payments p
       INNER JOIN registrations r ON r.id = p.registration_id
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN events e ON e.id = r.event_id
       ${whereClause}
       ORDER BY p.created_at DESC, p.id DESC`,
      values,
    );

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Unable to load admin payments:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load payments right now.' },
      { status: 500 },
    );
  }
}
