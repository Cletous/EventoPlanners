import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { parseEventId, validateEventPayload } from '@/lib/event-validation';

export const runtime = 'nodejs';

function unauthorized(authentication) {
  return NextResponse.json(
    { success: false, message: authentication.message },
    { status: authentication.status },
  );
}

async function resolveId(context) {
  const params = await context.params;
  return parseEventId(params.id);
}

async function fetchEvent(id) {
  const [rows] = await pool.execute(
    `SELECT
       e.id, e.title, e.description, e.venue, e.event_date, e.start_time,
       e.registration_fee, e.capacity, e.status, e.image_url,
       e.created_at, e.updated_at,
       COUNT(r.id) AS registration_count
     FROM events e
     LEFT JOIN registrations r ON r.event_id = e.id
     WHERE e.id = ?
     GROUP BY e.id
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
}

export async function GET(request, context) {
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) return unauthorized(authentication);

  const id = await resolveId(context);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid event ID.' }, { status: 400 });
  }

  try {
    const event = await fetchEvent(id);
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Unable to load event:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load the event right now.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request, context) {
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) return unauthorized(authentication);

  const id = await resolveId(context);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid event ID.' }, { status: 400 });
  }

  try {
    const existing = await fetchEvent(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Event not found.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateEventPayload(body, { partial: true });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: 'Please correct the event details.', errors: validation.errors },
        { status: 422 },
      );
    }

    const entries = Object.entries(validation.data);
    const assignments = entries.map(([field]) => `${field} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    await pool.execute(
      `UPDATE events SET ${assignments} WHERE id = ?`,
      [...values, id],
    );

    const event = await fetchEvent(id);

    return NextResponse.json({
      success: true,
      message: body.status === 'published'
        ? 'Event published successfully.'
        : body.status === 'closed'
          ? 'Event closed successfully.'
          : 'Event updated successfully.',
      event,
    });
  } catch (error) {
    console.error('Unable to update event:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to update the event right now.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) return unauthorized(authentication);

  const id = await resolveId(context);
  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid event ID.' }, { status: 400 });
  }

  try {
    const event = await fetchEvent(id);
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found.' }, { status: 404 });
    }

    if (Number(event.registration_count) > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'This event has registrations and cannot be deleted. Close the event instead.',
        },
        { status: 409 },
      );
    }

    await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json(
        {
          success: false,
          message: 'This event has registrations and cannot be deleted. Close the event instead.',
        },
        { status: 409 },
      );
    }

    console.error('Unable to delete event:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to delete the event right now.' },
      { status: 500 },
    );
  }
}
