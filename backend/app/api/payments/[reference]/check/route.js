import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { PaymentSyncError, syncPaymentWithPaynow } from '@/lib/payment-sync';

export const runtime = 'nodejs';

function unauthorized(authentication) {
  return NextResponse.json(
    { success: false, message: authentication.message },
    { status: authentication.status },
  );
}

export async function POST(request, context) {
  const authentication = authenticateRequest(request, ['user']);
  if (!authentication.ok) return unauthorized(authentication);

  const params = await context.params;
  const reference = String(params.reference || '').trim();
  if (!reference) {
    return NextResponse.json(
      { success: false, message: 'Payment reference is required.' },
      { status: 400 },
    );
  }

  try {
    const payment = await syncPaymentWithPaynow(reference, {
      userId: Number(authentication.payload.sub),
    });

    return NextResponse.json({
      success: true,
      message: payment.status === 'paid'
        ? 'Paynow confirms that this payment was successful.'
        : payment.status === 'failed'
          ? 'Paynow confirms that this payment was not successful.'
          : 'Paynow still reports this payment as pending.',
      payment: {
        ...payment,
        can_poll: Boolean(payment.poll_url),
        poll_url: undefined,
      },
    });
  } catch (error) {
    console.error('Unable to check Paynow payment status:', error);
    const status = error instanceof PaymentSyncError ? error.status : 502;
    return NextResponse.json(
      { success: false, message: error.message || 'Unable to check Paynow right now.' },
      { status },
    );
  }
}
