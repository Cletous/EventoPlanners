import { randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*?';
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function pick(chars) {
  return chars[randomInt(0, chars.length)];
}

function generateTemporaryPassword() {
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < 14) chars.push(pick(ALL));

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }
  return chars.join('');
}

export async function POST(request, { params }) {
  const authentication = await authenticateRequest(request, ['admin']);
  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message, code: authentication.code },
      { status: authentication.status },
    );
  }

  try {
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid user ID.' }, { status: 422 });
    }

    if (userId === Number(authentication.user.id)) {
      return NextResponse.json(
        { success: false, message: 'Use My account to change your own password.' },
        { status: 409 },
      );
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [userId],
    );
    const target = rows[0];
    if (!target) {
      return NextResponse.json({ success: false, message: 'Active user account not found.' }, { status: 404 });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await pool.execute(
      `UPDATE users
       SET password_hash = ?, must_change_password = 1, updated_at = NOW()
       WHERE id = ?`,
      [passwordHash, userId],
    );

    return NextResponse.json({
      success: true,
      message: `Password reset for ${target.name}. The temporary password is shown only once.`,
      user: { id: target.id, name: target.name, email: target.email },
      temporary_password: temporaryPassword,
    });
  } catch (error) {
    console.error('Unable to reset user password:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to reset the user password right now.' },
      { status: 500 },
    );
  }
}
