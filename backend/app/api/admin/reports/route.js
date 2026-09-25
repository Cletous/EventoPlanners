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

function validDate(value) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? false : value;
}

function parseEventId(value) {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : false;
}

function number(value) {
  return Number(value || 0);
}

export async function GET(request) {
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) return unauthorized(authentication);

  const from = validDate(request.nextUrl.searchParams.get('from')?.trim() || '');
  const to = validDate(request.nextUrl.searchParams.get('to')?.trim() || '');
  const eventId = parseEventId(request.nextUrl.searchParams.get('event_id')?.trim() || '');

  if (from === false || to === false) {
    return NextResponse.json(
      { success: false, message: 'Report dates must use YYYY-MM-DD format.' },
      { status: 400 },
    );
  }

  if (eventId === false) {
    return NextResponse.json(
      { success: false, message: 'Invalid event filter.' },
      { status: 400 },
    );
  }

  if (from && to && from > to) {
    return NextResponse.json(
      { success: false, message: 'The start date cannot be after the end date.' },
      { status: 400 },
    );
  }

  try {
    const conditions = [];
    const values = [];

    if (from) {
      conditions.push('e.event_date >= ?');
      values.push(from);
    }

    if (to) {
      conditions.push('e.event_date <= ?');
      values.push(to);
    }

    if (eventId) {
      conditions.push('e.id = ?');
      values.push(eventId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [events] = await pool.execute(
      `SELECT
         e.id, e.title, e.venue, e.event_date, e.start_time,
         e.registration_fee, e.capacity, e.status,
         COUNT(DISTINCT r.id) AS registration_count,
         COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) AS confirmed_count,
         COUNT(DISTINCT CASE WHEN r.status = 'pending_payment' THEN r.id END) AS pending_count,
         COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.id END) AS cancelled_count,
         COUNT(DISTINCT CASE WHEN p.status = 'paid' THEN p.id END) AS paid_payment_count,
         COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) AS paid_amount
       FROM events e
       LEFT JOIN registrations r ON r.event_id = e.id
       LEFT JOIN payments p ON p.registration_id = r.id
       ${whereClause}
       GROUP BY
         e.id, e.title, e.venue, e.event_date, e.start_time,
         e.registration_fee, e.capacity, e.status
       ORDER BY e.event_date ASC, e.start_time ASC, e.id ASC`,
      values,
    );

    const [registrations] = await pool.execute(
      `SELECT
         r.id, r.status, r.created_at,
         u.id AS user_id, u.name AS user_name, u.email AS user_email,
         e.id AS event_id, e.title AS event_title, e.venue AS event_venue,
         e.event_date, e.start_time, e.registration_fee,
         COUNT(p.id) AS payment_attempt_count,
         SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) AS paid_payment_count
       FROM registrations r
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN events e ON e.id = r.event_id
       LEFT JOIN payments p ON p.registration_id = r.id
       ${whereClause}
       GROUP BY
         r.id, r.status, r.created_at,
         u.id, u.name, u.email,
         e.id, e.title, e.venue, e.event_date, e.start_time, e.registration_fee
       ORDER BY e.event_date ASC, r.created_at DESC, r.id DESC`,
      values,
    );

    const [payments] = await pool.execute(
      `SELECT
         p.id, p.registration_id, p.amount, p.reference, p.paynow_reference,
         p.status, p.created_at,
         u.id AS user_id, u.name AS user_name, u.email AS user_email,
         e.id AS event_id, e.title AS event_title, e.event_date
       FROM payments p
       INNER JOIN registrations r ON r.id = p.registration_id
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN events e ON e.id = r.event_id
       ${whereClause}
       ORDER BY p.created_at DESC, p.id DESC`,
      values,
    );

    const [eventOptions] = await pool.execute(
      `SELECT id, title, event_date, status
       FROM events
       ORDER BY event_date DESC, id DESC`,
    );

    const summary = {
      events: events.length,
      registrations: registrations.length,
      confirmed_registrations: registrations.filter((row) => row.status === 'confirmed').length,
      pending_registrations: registrations.filter((row) => row.status === 'pending_payment').length,
      cancelled_registrations: registrations.filter((row) => row.status === 'cancelled').length,
      payment_attempts: payments.length,
      paid_payments: payments.filter((row) => row.status === 'paid').length,
      pending_payments: payments.filter((row) => row.status === 'pending').length,
      failed_payments: payments.filter((row) => row.status === 'failed').length,
      paid_amount: payments
        .filter((row) => row.status === 'paid')
        .reduce((total, row) => total + number(row.amount), 0),
    };

    return NextResponse.json({
      success: true,
      filters: { from: from || '', to: to || '', event_id: eventId || '' },
      report: {
        summary,
        events,
        registrations,
        payments,
        event_options: eventOptions,
      },
    });
  } catch (error) {
    console.error('Unable to generate reports:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to generate reports right now.' },
      { status: 500 },
    );
  }
}
