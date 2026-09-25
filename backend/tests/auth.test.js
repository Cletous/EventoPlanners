import {
  authenticateRequest,
  createAccessToken,
  getBearerToken,
  verifyAccessToken,
} from '../lib/auth';

const originalSecret = process.env.JWT_SECRET;

beforeAll(() => {
  process.env.JWT_SECRET = 'automated-test-secret';
});

afterAll(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

function requestWithAuthorization(value) {
  return new Request('http://localhost/api/test', {
    headers: value ? { authorization: value } : {},
  });
}

describe('JWT authentication helpers', () => {
  test('creates and verifies an access token containing user identity and role', () => {
    const token = createAccessToken({
      id: 42,
      email: 'attendee@example.com',
      role: 'user',
    });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('42');
    expect(payload.email).toBe('attendee@example.com');
    expect(payload.role).toBe('user');
  });

  test('extracts a Bearer token and ignores missing or malformed authorization', () => {
    expect(getBearerToken(requestWithAuthorization('Bearer abc123'))).toBe('abc123');
    expect(getBearerToken(requestWithAuthorization('Basic abc123'))).toBeNull();
    expect(getBearerToken(requestWithAuthorization())).toBeNull();
  });

  test('returns 401 when no token is supplied', () => {
    const result = authenticateRequest(requestWithAuthorization(), ['admin']);

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: 'Authentication token is required.',
    });
  });

  test('returns 403 when a valid user token requests an admin-only resource', () => {
    const token = createAccessToken({
      id: 7,
      email: 'user@example.com',
      role: 'user',
    });
    const result = authenticateRequest(
      requestWithAuthorization(`Bearer ${token}`),
      ['admin'],
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  test('allows a valid token with an allowed role', () => {
    const token = createAccessToken({
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
    });
    const result = authenticateRequest(
      requestWithAuthorization(`Bearer ${token}`),
      ['admin'],
    );

    expect(result.ok).toBe(true);
    expect(result.payload.role).toBe('admin');
  });

  test('returns 401 for an invalid token', () => {
    const result = authenticateRequest(
      requestWithAuthorization('Bearer definitely-not-a-jwt'),
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });
});
