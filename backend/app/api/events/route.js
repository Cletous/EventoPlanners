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

  try {
    const search = request.nextUrl.searchParams.get('search')?.trim() || '';
    const values = [];
    let searchClause = '';

    if (search) {
      searchClause = 'AND (e.title LIKE ? OR e.venue LIKE ? OR e.description LIKE ?)';
      const pattern = `%${search}%`;
      values.push(pattern, pattern, pattern);
    }

    const [events] = await pool.execute(
      `SELECT
         e.id, e.title, e.description, e.venue, e.event_date, e.start_time,
         e.registration_fee, e.capacity, e.status, e.image_url,
         COUNT(CASE WHEN r.status <> 'cancelled' THEN 1 END) AS registration_count
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       WHERE e.status = 'published'
       ${searchClause}
       GROUP BY e.id
       ORDER BY e.event_date ASC, e.start_time ASC, e.id DESC`,
      values,
    );

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Unable to load published events:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load published events right now.' },
      { status: 500 },
    );
  }
}
