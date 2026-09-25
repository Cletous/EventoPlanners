import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import { createAccessToken } from '@/lib/auth';

export const runtime = 'nodejs';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validateRegistration({ name, email, password }) {
  if (!name || name.length < 2 || name.length > 100) {
    return 'Name must be between 2 and 100 characters.';
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 150) {
    return 'Enter a valid email address.';
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return 'Password must be between 8 and 72 characters.';
  }

  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = normalizeEmail(body.email);
    const password = body.password;

    const validationError = validateRegistration({ name, email, password });

    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 422 },
      );
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email],
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, 'user', NOW(), NOW())`,
      [name, email, passwordHash],
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role: 'user',
    };

    const token = createAccessToken(user);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully.',
        token,
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration failed:', error);

    return NextResponse.json(
      { success: false, message: 'Unable to create account right now.' },
      { status: 500 },
    );
  }
}
