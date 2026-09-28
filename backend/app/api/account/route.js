import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(request) {
  const authentication = await authenticateRequest(request, [], { allowPasswordChangeRequired: true });
  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message },
      { status: authentication.status },
    );
  }

  try {
    const body = await request.json();
    const password = body.password;

    if (typeof password !== 'string' || !password) {
      return NextResponse.json(
        { success: false, message: 'Your current password is required to delete the account.' },
        { status: 422 },
      );
    }

    const [rows] = await pool.execute(
      'SELECT password_hash, role FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [authentication.user.id],
    );
    const row = rows[0];

    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect.' },
        { status: 401 },
      );
    }

    if (row.role === 'admin') {
      const [adminRows] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM users
         WHERE role = 'admin' AND deleted_at IS NULL`,
      );
      if (Number(adminRows[0].total) <= 1) {
        return NextResponse.json(
          { success: false, message: 'The only active administrator account cannot be deleted.' },
          { status: 409 },
        );
      }
    }

    const tombstoneEmail = `deleted+${authentication.user.id}+${Date.now()}@eventoplanners.invalid`;
    const disabledPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

    await pool.execute(
      `UPDATE users
       SET name = 'Deleted User', email = ?, password_hash = ?, role = 'user',
           must_change_password = 0, deleted_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [tombstoneEmail, disabledPassword, authentication.user.id],
    );

    return NextResponse.json({
      success: true,
      message: 'Your account has been deleted. Historical event records have been retained in anonymized form.',
    });
  } catch (error) {
    console.error('Unable to delete account:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to delete your account right now.' },
      { status: 500 },
    );
  }
}
