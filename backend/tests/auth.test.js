import pool from '../lib/db';
import {
  authenticateRequest,
  createAccessToken,
  getBearerToken,
  verifyAccessToken,
} from '../lib/auth';

jest.mock('../lib/db', () => ({
  __esModule: true,
  default: { execute: jest.fn() },
}));

const originalSecret = process.env.JWT_SECRET;

beforeAll(() => {
  process.env.JWT_SECRET = 'automated-test-secret';
});

beforeEach(() => {
  pool.execute.mockReset();
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

function activeUser(overrides = {}) {
  return {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    must_change_password: 0,
    ...overrides,
  };
}

describe('JWT authentication helpers', () => {
  test('creates and verifies an access token containing user identity and role', () => {
    const token = createAccessToken({ id: 42, email: 'attendee@example.com', role: 'user' });
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

  test('returns 401 when no token is supplied', async () => {
    const result = await authenticateRequest(requestWithAuthorization(), ['admin']);
    expect(result).toEqual({ ok: false, status: 401, message: 'Authentication token is required.' });
  });

  test('uses the current database role rather than trusting a stale token role', async () => {
    const token = createAccessToken({ id: 7, email: 'user@example.com', role: 'user' });
    pool.execute.mockResolvedValue([[activeUser({ id: 7, email: 'user@example.com', role: 'user' })]]);
    const result = await authenticateRequest(requestWithAuthorization(`Bearer ${token}`), ['admin']);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  test('allows a valid token when the active database role is allowed', async () => {
    const token = createAccessToken({ id: 1, email: 'admin@example.com', role: 'admin' });
    pool.execute.mockResolvedValue([[activeUser()]]);
    const result = await authenticateRequest(requestWithAuthorization(`Bearer ${token}`), ['admin']);
    expect(result.ok).toBe(true);
    expect(result.payload.role).toBe('admin');
    expect(result.user.must_change_password).toBe(false);
  });

  test('blocks normal application access when a password change is required', async () => {
    const token = createAccessToken({ id: 1, email: 'admin@example.com', role: 'admin' });
    pool.execute.mockResolvedValue([[activeUser({ must_change_password: 1 })]]);
    const result = await authenticateRequest(requestWithAuthorization(`Bearer ${token}`), ['admin']);
    expect(result).toMatchObject({ ok: false, status: 403, code: 'PASSWORD_CHANGE_REQUIRED' });
  });

  test('allows the account password endpoint to authenticate during a forced password change', async () => {
    const token = createAccessToken({ id: 1, email: 'admin@example.com', role: 'admin' });
    pool.execute.mockResolvedValue([[activeUser({ must_change_password: 1 })]]);
    const result = await authenticateRequest(
      requestWithAuthorization(`Bearer ${token}`),
      ['admin'],
      { allowPasswordChangeRequired: true },
    );
    expect(result.ok).toBe(true);
    expect(result.user.must_change_password).toBe(true);
  });

  test('returns 401 when the token belongs to a deleted or missing account', async () => {
    const token = createAccessToken({ id: 5, email: 'old@example.com', role: 'user' });
    pool.execute.mockResolvedValue([[]]);
    const result = await authenticateRequest(requestWithAuthorization(`Bearer ${token}`));
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  test('returns 401 for an invalid token', async () => {
    const result = await authenticateRequest(requestWithAuthorization('Bearer definitely-not-a-jwt'));
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });
});
