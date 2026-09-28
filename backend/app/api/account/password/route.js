import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import { authenticateRequest, createAccessToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PATCH(request) {
  const authentication = await authenticateRequest(request, [], { allowPasswordChangeRequired: true });
  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message },
      { status: authentication.status },
    );
  }

  try {
    const body = await request.json();
    const currentPassword = body.current_password;
    const newPassword = body.new_password;

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password is required.' },
        { status: 422 },
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 72) {
      return NextResponse.json(
        { success: false, message: 'New password must be between 8 and 72 characters.' },
        { status: 422 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from the current password.' },
        { status: 422 },
      );
    }

    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [authentication.user.id],
    );
    const row = rows[0];

    if (!row || !(await bcrypt.compare(currentPassword, row.password_hash))) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect.' },
        { status: 401 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      `UPDATE users
       SET password_hash = ?, must_change_password = 0, updated_at = NOW()
       WHERE id = ?`,
      [passwordHash, authentication.user.id],
    );

    const user = { ...authentication.user, must_change_password: false };
    const token = createAccessToken(user);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
      token,
      user,
    });
  } catch (error) {
    console.error('Unable to change password:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to change your password right now.' },
      { status: 500 },
    );
  }
}
