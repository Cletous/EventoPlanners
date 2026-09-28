import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const authentication = await authenticateRequest(request, [], { allowPasswordChangeRequired: true });

  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message },
      { status: authentication.status },
    );
  }

  return NextResponse.json({ success: true, user: authentication.user });
}
