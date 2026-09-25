import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import { createAccessToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password;

    if (!email || typeof password !== 'string' || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 422 },
      );
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    const userRow = rows[0];

    if (!userRow) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, userRow.password_hash);

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    };

    const token = createAccessToken(user);

    return NextResponse.json({
      success: true,
      message: 'Login successful.',
      token,
      user,
    });
  } catch (error) {
    console.error('Login failed:', error);

    return NextResponse.json(
      { success: false, message: 'Unable to login right now.' },
      { status: 500 },
    );
  }
}
