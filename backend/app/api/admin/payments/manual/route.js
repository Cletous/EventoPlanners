import crypto from 'crypto';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const allowedMethods = new Set(['bank_transfer', 'manual']);

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

function cleanText(value, maxLength) {
  const text = String(value || '').trim();
  return text ? text.slice(0, maxLength) : '';
}

function createReference(registrationId, method) {
  const prefix = method === 'bank_transfer' ? 'BANK' : 'MAN';
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVP-${prefix}-${registrationId}-${Date.now()}-${suffix}`;
}

export async function POST(request) {
  const authentication = await authenticateRequest(request, ['admin']);
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

  const registrationId = parseRegistrationId(body?.registration_id);
  const paymentMethod = String(body?.payment_method || '').trim();
  const externalReference = cleanText(body?.external_reference, 150);
  const notes = cleanText(body?.notes, 500);

  if (!registrationId) {
    return NextResponse.json(
      { success: false, message: 'A valid registration ID is required.' },
      { status: 400 },
    );
  }

  if (!allowedMethods.has(paymentMethod)) {
    return NextResponse.json(
      { success: false, message: 'Payment method must be bank transfer or manual payment.' },
      { status: 400 },
    );
  }

  if (paymentMethod === 'bank_transfer' && !externalReference) {
    return NextResponse.json(
      { success: false, message: 'A bank transaction/reference number is required for bank transfers.' },
      { status: 400 },
    );
  }

  const adminId = Number(authentication.payload.sub);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT
         r.id, r.status AS registration_status,
         u.name AS user_name, u.email AS user_email,
         e.id AS event_id, e.title AS event_title, e.registration_fee
       FROM registrations r
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN events e ON e.id = r.event_id
       WHERE r.id = ?
       LIMIT 1
       FOR UPDATE`,
      [registrationId],
    );

    const registration = rows[0];
    if (!registration) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'Registration not found.' },
        { status: 404 },
      );
    }

    if (registration.registration_status !== 'pending_payment') {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'Only registrations that are pending payment can be confirmed offline.' },
        { status: 409 },
      );
    }

    const amount = Number(registration.registration_fee);
    if (!Number.isFinite(amount) || amount <= 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'This registration does not have a payable event fee.' },
        { status: 409 },
      );
    }

    const [paidRows] = await connection.execute(
      `SELECT id FROM payments
       WHERE registration_id = ? AND status = 'paid'
       LIMIT 1`,
      [registrationId],
    );

    if (paidRows.length) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'This registration already has a confirmed paid payment.' },
        { status: 409 },
      );
    }

    const reference = createReference(registrationId, paymentMethod);
    const [insertResult] = await connection.execute(
      `INSERT INTO payments (
         registration_id, payment_method, amount, reference,
         external_reference, confirmation_notes, status, confirmed_by, confirmed_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, CURRENT_TIMESTAMP)`,
      [
        registrationId,
        paymentMethod,
        amount.toFixed(2),
        reference,
        externalReference || null,
        notes || null,
        adminId,
      ],
    );

    await connection.execute(
      `UPDATE registrations
       SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [registrationId],
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: paymentMethod === 'bank_transfer'
        ? 'Bank transfer confirmed and registration activated.'
        : 'Manual payment confirmed and registration activated.',
      payment: {
        id: insertResult.insertId,
        registration_id: registrationId,
        payment_method: paymentMethod,
        amount: amount.toFixed(2),
        reference,
        external_reference: externalReference || null,
        status: 'paid',
        confirmed_by: adminId,
      },
    }, { status: 201 });
  } catch (error) {
    try { await connection.rollback(); } catch {}
    console.error('Unable to confirm offline payment:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to confirm the offline payment right now.' },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
