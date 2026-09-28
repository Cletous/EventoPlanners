import jwt from 'jsonwebtoken';
import pool from './db';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return secret;
}

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: '8h' },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || '';

  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

export async function authenticateRequest(request, allowedRoles = [], options = {}) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: 'Authentication token is required.',
    };
  }

  try {
    const payload = verifyAccessToken(token);
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, must_change_password
       FROM users
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [payload.sub],
    );
    const user = rows[0];

    if (!user) {
      return {
        ok: false,
        status: 401,
        message: 'User account no longer exists or is inactive.',
      };
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return {
        ok: false,
        status: 403,
        message: 'You do not have permission to access this resource.',
      };
    }

    if (user.must_change_password && !options.allowPasswordChangeRequired) {
      return {
        ok: false,
        status: 403,
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must change your password before continuing.',
      };
    }

    return {
      ok: true,
      payload: {
        ...payload,
        sub: String(user.id),
        email: user.email,
        role: user.role,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        must_change_password: Boolean(user.must_change_password),
      },
    };
  } catch {
    return {
      ok: false,
      status: 401,
      message: 'Authentication token is invalid or expired.',
    };
  }
}
