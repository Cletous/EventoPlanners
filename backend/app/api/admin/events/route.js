import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { validateEventPayload } from '@/lib/event-validation';

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
    const search = request.nextUrl.searchParams.get('search')?.trim() || '';
    const values = [];
    let whereClause = '';

    if (search) {
      whereClause = `WHERE e.title LIKE ? OR e.venue LIKE ? OR e.description LIKE ?`;
      const pattern = `%${search}%`;
      values.push(pattern, pattern, pattern);
    }

    const [events] = await pool.execute(
      `SELECT
         e.id, e.title, e.description, e.venue, e.event_date, e.start_time,
         e.registration_fee, e.capacity, e.status, e.image_url,
         e.created_at, e.updated_at,
         COUNT(r.id) AS registration_count
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       ${whereClause}
       GROUP BY e.id
       ORDER BY e.event_date ASC, e.start_time ASC, e.id DESC`,
      values,
    );

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Unable to list events:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load events right now.' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) return unauthorized(authentication);

  try {
    const body = await request.json();
    const validation = validateEventPayload(body);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: 'Please correct the event details.', errors: validation.errors },
        { status: 422 },
      );
    }

    const event = validation.data;
    const [result] = await pool.execute(
      `INSERT INTO events
       (title, description, venue, event_date, start_time, registration_fee, capacity, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.title,
        event.description,
        event.venue,
        event.event_date,
        event.start_time,
        event.registration_fee,
        event.capacity,
        event.status,
        event.image_url,
      ],
    );

    const [rows] = await pool.execute(
      `SELECT id, title, description, venue, event_date, start_time,
              registration_fee, capacity, status, image_url, created_at, updated_at
       FROM events WHERE id = ?`,
      [result.insertId],
    );

    return NextResponse.json(
      { success: true, message: 'Event created successfully.', event: rows[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error('Unable to create event:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to create the event right now.' },
      { status: 500 },
    );
  }
}
