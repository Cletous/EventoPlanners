import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const VALID_ROLES = new Set(['admin', 'user']);
const VALID_STATUSES = new Set(['active', 'deleted']);

export async function GET(request) {
  const authentication = await authenticateRequest(request, ['admin']);
  if (!authentication.ok) {
    return NextResponse.json(
      { success: false, message: authentication.message, code: authentication.code },
      { status: authentication.status },
    );
  }

  try {
    const url = new URL(request.url);
    const search = String(url.searchParams.get('search') || '').trim();
    const role = String(url.searchParams.get('role') || '').trim();
    const status = String(url.searchParams.get('status') || 'active').trim();

    if (role && !VALID_ROLES.has(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role filter.' }, { status: 422 });
    }
    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status filter.' }, { status: 422 });
    }

    const conditions = [];
    const params = [];

    if (status === 'active') conditions.push('u.deleted_at IS NULL');
    if (status === 'deleted') conditions.push('u.deleted_at IS NOT NULL');
    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }
    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR CAST(u.id AS CHAR) LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT
         u.id, u.name, u.email, u.role, u.must_change_password,
         u.created_at, u.updated_at, u.deleted_at,
         COUNT(r.id) AS registration_count,
         SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_registration_count
       FROM users u
       LEFT JOIN registrations r ON r.user_id = u.id
       ${where}
       GROUP BY u.id, u.name, u.email, u.role, u.must_change_password,
                u.created_at, u.updated_at, u.deleted_at
       ORDER BY u.deleted_at IS NOT NULL, u.created_at DESC, u.id DESC`,
      params,
    );

    const users = rows.map((row) => ({
      ...row,
      must_change_password: Boolean(row.must_change_password),
      registration_count: Number(row.registration_count || 0),
      confirmed_registration_count: Number(row.confirmed_registration_count || 0),
      active: !row.deleted_at,
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Unable to load admin users:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load users right now.' },
      { status: 500 },
    );
  }
}
