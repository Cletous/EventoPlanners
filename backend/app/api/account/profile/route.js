import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validateProfile({ name, email }) {
  if (!name || name.length < 2 || name.length > 100) {
    return 'Name must be between 2 and 100 characters.';
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 150) {
    return 'Enter a valid email address.';
  }
  return null;
}

export async function PATCH(request) {
  const authentication = await authenticateRequest(request, [], { allowPasswordChangeRequired: true });
  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message, code: authentication.code },
      { status: authentication.status },
    );
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = normalizeEmail(body.email);
    const validationError = validateProfile({ name, email });

    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 422 });
    }

    const [duplicates] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id <> ? AND deleted_at IS NULL LIMIT 1',
      [email, authentication.user.id],
    );

    if (duplicates.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Another account already uses this email address.' },
        { status: 409 },
      );
    }

    await pool.execute(
      'UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
      [name, email, authentication.user.id],
    );

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      user: { ...authentication.user, name, email },
    });
  } catch (error) {
    console.error('Unable to update profile:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to update your profile right now.' },
      { status: 500 },
    );
  }
}
