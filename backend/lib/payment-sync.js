import pool from '@/lib/db';
import { mapPaynowStatus, pollPaynowTransaction } from '@/lib/paynow';

export class PaymentSyncError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'PaymentSyncError';
    this.status = status;
  }
}

function paymentSelect(userScoped = false) {
  return `SELECT
      p.id, p.registration_id, p.amount, p.reference, p.paynow_reference,
      p.poll_url, p.status, p.created_at, p.updated_at,
      r.user_id, r.status AS registration_status,
      e.id AS event_id, e.title, e.event_date, e.start_time, e.venue,
      u.name AS user_name, u.email AS user_email
    FROM payments p
    INNER JOIN registrations r ON r.id = p.registration_id
    INNER JOIN events e ON e.id = r.event_id
    INNER JOIN users u ON u.id = r.user_id
    WHERE p.reference = ?${userScoped ? ' AND r.user_id = ?' : ''}
    LIMIT 1`;
}

export async function loadStoredPayment(reference, { userId = null } = {}) {
  const params = userId === null ? [reference] : [reference, userId];
  const [rows] = await pool.execute(paymentSelect(userId !== null), params);
  return rows[0] || null;
}

export async function syncPaymentWithPaynow(reference, { userId = null } = {}) {
  const payment = await loadStoredPayment(reference, { userId });

  if (!payment) {
    throw new PaymentSyncError('Payment not found.', 404);
  }

  if (payment.status === 'paid') {
    return payment;
  }

  if (!payment.poll_url) {
    throw new PaymentSyncError(
      'This payment attempt does not have a saved Paynow poll URL. Start a new Paynow payment attempt and try again.',
      409,
    );
  }

  const provider = await pollPaynowTransaction(payment.poll_url);
  const providerReference = String(provider.reference || '').trim();

  if (!providerReference || providerReference !== payment.reference) {
    throw new PaymentSyncError('Paynow returned a different payment reference.', 502);
  }

  const providerAmount = Number(provider.amount);
  const storedAmount = Number(payment.amount);
  if (
    !Number.isFinite(providerAmount)
    || providerAmount.toFixed(2) !== storedAmount.toFixed(2)
  ) {
    throw new PaymentSyncError('Paynow returned a different payment amount.', 502);
  }

  const mappedStatus = mapPaynowStatus(provider.status);
  const paynowReference = provider.paynowreference || payment.paynow_reference || null;
  const refreshedPollUrl = provider.pollurl || payment.poll_url;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE payments
       SET status = ?,
           paynow_reference = ?,
           poll_url = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status <> 'paid'`,
      [mappedStatus, paynowReference, refreshedPollUrl, payment.id],
    );

    if (mappedStatus === 'paid') {
      await connection.execute(
        `UPDATE registrations
         SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [payment.registration_id],
      );
    }

    await connection.commit();
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  } finally {
    connection.release();
  }

  return loadStoredPayment(reference, { userId });
}
