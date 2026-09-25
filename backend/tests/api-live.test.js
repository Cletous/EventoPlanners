import request from 'supertest';

const api = request('http://localhost:3001');

describe('EventoPlanners live API smoke and access-control tests', () => {
  test('GET /api/health reports that the API is running', async () => {
    const response = await api.get('/api/health').expect(200);

    expect(response.body).toMatchObject({ success: true, database: true });
    expect(String(response.body.message || '')).toMatch(/EventoPlanners API is running/i);
  });

  test('GET /api/admin/dashboard rejects an unauthenticated request', async () => {
    const response = await api.get('/api/admin/dashboard').expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });

  test('GET /api/user/dashboard rejects an unauthenticated request', async () => {
    const response = await api.get('/api/user/dashboard').expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Authentication token is required.');
  });

  test('GET /api/admin/reports rejects an unauthenticated request', async () => {
    const response = await api.get('/api/admin/reports').expect(401);

    expect(response.body.success).toBe(false);
  });
});
