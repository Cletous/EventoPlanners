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

function parseRegistrationId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request, context) {
  const authentication = authenticateRequest(request, ['user']);
  if (!authentication.ok) return unauthorized(authentication);

  const params = await context.params;
  const id = parseRegistrationId(params.id);
  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Invalid registration ID.' },
      { status: 400 },
    );
  }

  const userId = Number(authentication.payload.sub);

  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.status, e.title
       FROM registrations r
       INNER JOIN events e ON e.id = r.event_id
       WHERE r.id = ? AND r.user_id = ?
       LIMIT 1`,
      [id, userId],
    );

    const registration = rows[0];
    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found.' },
        { status: 404 },
      );
    }

    if (registration.status !== 'pending_payment') {
      return NextResponse.json(
        { success: false, message: 'Only unpaid pending registrations can be cancelled.' },
        { status: 409 },
      );
    }

    await pool.execute(
      `UPDATE registrations
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    return NextResponse.json({
      success: true,
      message: `Registration for ${registration.title} has been cancelled.`,
      registration: { id, status: 'cancelled' },
    });
  } catch (error) {
    console.error('Unable to cancel registration:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to cancel this registration right now.' },
      { status: 500 },
    );
  }
}
