import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { loadStoredPayment } from '@/lib/payment-sync';

export const runtime = 'nodejs';

function unauthorized(authentication) {
  return NextResponse.json(
    { success: false, message: authentication.message },
    { status: authentication.status },
  );
}

export async function GET(request, context) {
  const authentication = await authenticateRequest(request, ['user']);
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
    const payment = await loadStoredPayment(reference, {
      userId: Number(authentication.payload.sub),
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        can_poll: Boolean(payment.poll_url),
        poll_url: undefined,
      },
    });
  } catch (error) {
    console.error('Unable to load payment status:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load payment status right now.' },
      { status: 500 },
    );
  }
}
