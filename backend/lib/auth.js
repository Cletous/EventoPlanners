import jwt from 'jsonwebtoken';

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

export function authenticateRequest(request, allowedRoles = []) {
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

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return {
        ok: false,
        status: 403,
        message: 'You do not have permission to access this resource.',
      };
    }

    return { ok: true, payload };
  } catch {
    return {
      ok: false,
      status: 401,
      message: 'Authentication token is invalid or expired.',
    };
  }
}
