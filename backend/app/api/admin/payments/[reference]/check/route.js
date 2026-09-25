import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { PaymentSyncError, syncPaymentWithPaynow } from '@/lib/payment-sync';

export const runtime = 'nodejs';

export async function POST(request, context) {
  const authentication = authenticateRequest(request, ['admin']);
  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message },
      { status: authentication.status },
    );
  }

  const params = await context.params;
  const reference = String(params.reference || '').trim();
  if (!reference) {
    return NextResponse.json(
      { success: false, message: 'Payment reference is required.' },
      { status: 400 },
    );
  }

  try {
    const payment = await syncPaymentWithPaynow(reference);
    return NextResponse.json({
      success: true,
      message: `Paynow status checked: ${payment.status}.`,
      payment: {
        ...payment,
        can_poll: Boolean(payment.poll_url),
        poll_url: undefined,
      },
    });
  } catch (error) {
    console.error('Administrator Paynow status check failed:', error);
    const status = error instanceof PaymentSyncError ? error.status : 502;
    return NextResponse.json(
      { success: false, message: error.message || 'Unable to check Paynow right now.' },
      { status },
    );
  }
}
