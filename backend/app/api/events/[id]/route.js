import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { parseEventId } from '@/lib/event-validation';

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
  const id = parseEventId(params.id);

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Invalid event ID.' },
      { status: 400 },
    );
  }

  try {
    const [rows] = await pool.execute(
      `SELECT
         e.id, e.title, e.description, e.venue, e.event_date, e.start_time,
         e.registration_fee, e.capacity, e.status, e.image_url,
         COUNT(CASE WHEN r.status <> 'cancelled' THEN 1 END) AS registration_count
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       WHERE e.id = ? AND e.status = 'published'
       GROUP BY e.id
       LIMIT 1`,
      [id],
    );

    const event = rows[0];

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Published event not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Unable to load published event:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load the event right now.' },
      { status: 500 },
    );
  }
}
