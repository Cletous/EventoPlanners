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

export async function GET(request, context) {
  const authentication = authenticateRequest(request, ['user']);
  if (!authentication.ok) return unauthorized(authentication);

  const params = await context.params;
  const reference = String(params.reference || '').trim();
  if (!reference) {
    return NextResponse.json(
      { success: false, message: 'Payment reference is required.' },
      { status: 400 },
    );
  }

  try {
    const userId = Number(authentication.payload.sub);
    const [rows] = await pool.execute(
      `SELECT
         p.id, p.reference, p.paynow_reference, p.amount, p.status,
         p.created_at, p.updated_at,
         r.id AS registration_id, r.status AS registration_status,
         e.id AS event_id, e.title, e.event_date, e.start_time, e.venue
       FROM payments p
       INNER JOIN registrations r ON r.id = p.registration_id
       INNER JOIN events e ON e.id = r.event_id
       WHERE p.reference = ? AND r.user_id = ?
       LIMIT 1`,
      [reference, userId],
    );

    const payment = rows[0];
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Unable to load payment status:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load payment status right now.' },
      { status: 500 },
    );
  }
}
