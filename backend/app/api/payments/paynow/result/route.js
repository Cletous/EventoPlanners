import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  getPaynowConfig,
  mapPaynowStatus,
  parsePaynowMessage,
  verifyPaynowMessage,
} from '@/lib/paynow';

export const runtime = 'nodejs';

export async function POST(request) {
  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return new NextResponse('Invalid Paynow payload.', { status: 400 });
  }

  try {
    const config = getPaynowConfig();
    const parsed = parsePaynowMessage(rawBody);

    if (!verifyPaynowMessage(parsed.entries, config.integrationKey)) {
      console.error('Rejected Paynow callback because hash validation failed.');
      return new NextResponse('Invalid hash.', { status: 400 });
    }

    const reference = parsed.data.reference;
    if (!reference) {
      return new NextResponse('Missing reference.', { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `SELECT
           p.id, p.registration_id, p.amount, p.status AS payment_status,
           r.status AS registration_status
         FROM payments p
         INNER JOIN registrations r ON r.id = p.registration_id
         WHERE p.reference = ?
         LIMIT 1
         FOR UPDATE`,
        [reference],
      );

      const payment = rows[0];
      if (!payment) {
        await connection.rollback();
        return new NextResponse('Payment reference not found.', { status: 404 });
      }

      const callbackAmount = Number(parsed.data.amount);
      const storedAmount = Number(payment.amount);
      if (
        !Number.isFinite(callbackAmount)
        || callbackAmount.toFixed(2) !== storedAmount.toFixed(2)
      ) {
        await connection.rollback();
        console.error(`Rejected Paynow callback due to amount mismatch for ${reference}.`);
        return new NextResponse('Amount mismatch.', { status: 400 });
      }

      const mappedStatus = mapPaynowStatus(parsed.data.status);
      const paynowReference = parsed.data.paynowreference || null;
      const pollUrl = parsed.data.pollurl || null;

      await connection.execute(
        `UPDATE payments
         SET status = CASE WHEN status = 'paid' THEN 'paid' ELSE ? END,
             paynow_reference = COALESCE(?, paynow_reference),
             poll_url = COALESCE(?, poll_url),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [mappedStatus, paynowReference, pollUrl, payment.id],
      );

      if (mappedStatus === 'paid' && payment.registration_status !== 'confirmed') {
        await connection.execute(
          `UPDATE registrations
           SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [payment.registration_id],
        );
      }

      await connection.commit();
      return new NextResponse('OK', { status: 200 });
    } catch (error) {
      try { await connection.rollback(); } catch {}
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Unable to process Paynow callback:', error);
    return new NextResponse('Unable to process Paynow callback.', { status: 500 });
  }
}
