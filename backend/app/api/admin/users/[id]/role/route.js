import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const runtime = 'nodejs';

const VALID_ROLES = new Set(['admin', 'user']);

export async function PATCH(request, { params }) {
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

    const body = await request.json();
    const role = String(body.role || '').trim();
    if (!VALID_ROLES.has(role)) {
      return NextResponse.json({ success: false, message: 'Role must be admin or user.' }, { status: 422 });
    }

    if (userId === Number(authentication.user.id)) {
      return NextResponse.json(
        { success: false, message: 'Use another administrator account to change your own role.' },
        { status: 409 },
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute(
        'SELECT id, name, email, role, deleted_at FROM users WHERE id = ? FOR UPDATE',
        [userId],
      );
      const target = rows[0];

      if (!target || target.deleted_at) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: 'Active user account not found.' },
          { status: 404 },
        );
      }

      if (target.role === role) {
        await connection.rollback();
        return NextResponse.json({
          success: true,
          message: `${target.name} already has the ${role === 'admin' ? 'Administrator' : 'User'} role.`,
          user: { id: target.id, name: target.name, email: target.email, role: target.role },
        });
      }

      if (target.role === 'admin' && role === 'user') {
        const [adminRows] = await connection.execute(
          `SELECT COUNT(*) AS total
           FROM users
           WHERE role = 'admin' AND deleted_at IS NULL`,
        );
        if (Number(adminRows[0].total) <= 1) {
          await connection.rollback();
          return NextResponse.json(
            { success: false, message: 'The last active administrator cannot be demoted.' },
            { status: 409 },
          );
        }
      }

      await connection.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        [role, userId],
      );
      await connection.commit();

      return NextResponse.json({
        success: true,
        message: `${target.name} is now ${role === 'admin' ? 'an Administrator' : 'a standard User'}.`,
        user: { id: target.id, name: target.name, email: target.email, role },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Unable to update user role:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to update the user role right now.' },
      { status: 500 },
    );
  }
}
