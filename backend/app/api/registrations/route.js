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

function parseEventId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request) {
  const authentication = authenticateRequest(request, ['user']);
  if (!authentication.ok) return unauthorized(authentication);

  try {
    const userId = Number(authentication.payload.sub);
    const [registrations] = await pool.execute(
      `SELECT
         r.id, r.user_id, r.event_id, r.status, r.created_at, r.updated_at,
         e.title, e.description, e.venue, e.event_date, e.start_time,
         e.registration_fee, e.capacity, e.status AS event_status, e.image_url
       FROM registrations r
       INNER JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC, r.id DESC`,
      [userId],
    );

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('Unable to load registrations:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load your registrations right now.' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const authentication = authenticateRequest(request, ['user']);
  if (!authentication.ok) return unauthorized(authentication);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'A valid JSON request body is required.' },
      { status: 400 },
    );
  }

  const eventId = parseEventId(body?.event_id);
  if (!eventId) {
    return NextResponse.json(
      { success: false, message: 'A valid event ID is required.' },
      { status: 400 },
    );
  }

  const userId = Number(authentication.payload.sub);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [events] = await connection.execute(
      `SELECT id, title, registration_fee, capacity, status
       FROM events
       WHERE id = ?
       FOR UPDATE`,
      [eventId],
    );

    const event = events[0];
    if (!event || event.status !== 'published') {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'This event is not available for registration.' },
        { status: 404 },
      );
    }

    const [existingRows] = await connection.execute(
      `SELECT id, status
       FROM registrations
       WHERE user_id = ? AND event_id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId, eventId],
    );

    const existing = existingRows[0];
    if (existing && existing.status !== 'cancelled') {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'You are already registered for this event.' },
        { status: 409 },
      );
    }

    const [countRows] = await connection.execute(
      `SELECT COUNT(*) AS active_count
       FROM registrations
       WHERE event_id = ? AND status <> 'cancelled'`,
      [eventId],
    );

    const activeCount = Number(countRows[0]?.active_count || 0);
    if (activeCount >= Number(event.capacity)) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'This event has reached its registration capacity.' },
        { status: 409 },
      );
    }

    const newStatus = Number(event.registration_fee) === 0 ? 'confirmed' : 'pending_payment';
    let registrationId;

    if (existing) {
      registrationId = existing.id;
      await connection.execute(
        `UPDATE registrations
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newStatus, registrationId],
      );
    } else {
      const [result] = await connection.execute(
        `INSERT INTO registrations (user_id, event_id, status)
         VALUES (?, ?, ?)`,
        [userId, eventId, newStatus],
      );
      registrationId = result.insertId;
    }

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: newStatus === 'confirmed'
          ? 'Registration confirmed for this free event.'
          : 'Registration created. Payment is required to confirm your place.',
        registration: {
          id: registrationId,
          event_id: eventId,
          status: newStatus,
        },
      },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    try { await connection.rollback(); } catch {}
    console.error('Unable to register for event:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to complete event registration right now.' },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
