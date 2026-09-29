import { expect } from '@playwright/test';

export const API_BASE = process.env.E2E_API_URL || 'http://localhost:3001/api';

export function uniqueValue(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function futureDate(days = 30) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export function adminCredentials() {
  return {
    email: process.env.E2E_ADMIN_EMAIL || '',
    password: process.env.E2E_ADMIN_PASSWORD || '',
  };
}

export function hasAdminCredentials() {
  const { email, password } = adminCredentials();
  return Boolean(email && password);
}

export async function registerUser(request, overrides = {}) {
  const suffix = uniqueValue('user');
  const user = {
    name: overrides.name || `E2E User ${suffix}`,
    email: overrides.email || `e2e.${suffix}@example.test`,
    password: overrides.password || 'EventoTest!234',
  };

  const response = await request.post(`${API_BASE}/auth/register`, { data: user });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return { ...user, token: body.token, id: body.user.id, role: body.user.role };
}

export async function loginAdminApi(request) {
  const credentials = adminCredentials();
  if (!credentials.email || !credentials.password) {
    throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD before running admin Playwright tests.');
  }

  const response = await request.post(`${API_BASE}/auth/login`, { data: credentials });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return { ...credentials, token: body.token, user: body.user };
}

export async function createEvent(request, adminToken, overrides = {}) {
  const suffix = uniqueValue('event');
  const event = {
    title: overrides.title || `E2E Event ${suffix}`,
    description: overrides.description || 'Playwright automated event for EventoPlanners end-to-end testing.',
    venue: overrides.venue || 'UZ Test Venue',
    event_date: overrides.event_date || futureDate(30),
    start_time: overrides.start_time || '10:00',
    registration_fee: overrides.registration_fee ?? 0,
    capacity: overrides.capacity ?? 25,
    status: overrides.status || 'published',
    image_url: overrides.image_url || '',
  };

  const response = await request.post(`${API_BASE}/admin/events`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: event,
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.event;
}

export async function updateEvent(request, adminToken, eventId, data) {
  const response = await request.patch(`${API_BASE}/admin/events/${eventId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data,
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).event;
}

export async function deleteEvent(request, adminToken, eventId) {
  return request.delete(`${API_BASE}/admin/events/${eventId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}

export async function createRegistration(request, userToken, eventId) {
  const response = await request.post(`${API_BASE}/registrations`, {
    headers: { Authorization: `Bearer ${userToken}` },
    data: { event_id: eventId },
  });
  expect([200, 201]).toContain(response.status());
  return (await response.json()).registration;
}

export async function injectToken(page, token) {
  await page.addInitScript((value) => {
    window.localStorage.setItem('eventoplanners_token', value);
  }, token);
}
