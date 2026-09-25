import crypto from 'crypto';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { initiatePaynowTransaction } from '@/lib/paynow';

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

function createReference(registrationId) {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVP-${registrationId}-${Date.now()}-${suffix}`;
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

  const registrationId = parseRegistrationId(body?.registration_id);
  if (!registrationId) {
    return NextResponse.json(
      { success: false, message: 'A valid registration ID is required.' },
      { status: 400 },
    );
  }

  const userId = Number(authentication.payload.sub);
  const connection = await pool.getConnection();
  let paymentId = null;
  let reference = null;

  try {
    const [rows] = await connection.execute(
      `SELECT
         r.id, r.status AS registration_status,
         e.id AS event_id, e.title, e.registration_fee,
         u.email
       FROM registrations r
       INNER JOIN events e ON e.id = r.event_id
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.id = ? AND r.user_id = ?
       LIMIT 1`,
      [registrationId, userId],
    );

    const registration = rows[0];
    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found.' },
        { status: 404 },
      );
    }

    if (registration.registration_status !== 'pending_payment') {
      return NextResponse.json(
        { success: false, message: 'This registration does not require payment.' },
        { status: 409 },
      );
    }

    const amount = Number(registration.registration_fee);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'This event does not have a payable registration fee.' },
        { status: 409 },
      );
    }

    reference = createReference(registrationId);
    const [insertResult] = await connection.execute(
      `INSERT INTO payments (registration_id, amount, reference, status)
       VALUES (?, ?, ?, 'pending')`,
      [registrationId, amount.toFixed(2), reference],
    );
    paymentId = insertResult.insertId;

    try {
      const paynowResponse = await initiatePaynowTransaction({
        reference,
        amount,
        title: registration.title,
        email: registration.email,
      });

      if (paynowResponse.paynowReference) {
        await connection.execute(
          `UPDATE payments
           SET paynow_reference = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [paynowResponse.paynowReference, paymentId],
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Paynow payment initiated.',
        payment: {
          id: paymentId,
          registration_id: registrationId,
          reference,
          amount: amount.toFixed(2),
          status: 'pending',
        },
        redirect_url: paynowResponse.redirectUrl,
      });
    } catch (paynowError) {
      await connection.execute(
        `UPDATE payments
         SET status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [paymentId],
      );

      console.error('Paynow initiation failed:', paynowError);
      return NextResponse.json(
        {
          success: false,
          message: paynowError.message || 'Unable to initiate Paynow payment.',
          reference,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error('Unable to create Paynow payment attempt:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to create a payment attempt right now.' },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
