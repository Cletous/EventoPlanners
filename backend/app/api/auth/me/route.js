import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const authentication = authenticateRequest(request);

  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message },
      { status: authentication.status },
    );
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
      [authentication.payload.sub],
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User account no longer exists.' },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Unable to load authenticated user:', error);

    return NextResponse.json(
      { success: false, message: 'Unable to load your account.' },
      { status: 500 },
    );
  }
}
