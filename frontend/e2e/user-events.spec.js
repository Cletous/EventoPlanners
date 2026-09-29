import { test, expect } from '@playwright/test';
import {
  createEvent,
  createRegistration,
  hasAdminCredentials,
  injectToken,
  loginAdminApi,
  registerUser,
} from './helpers/api.js';

test.describe('User event and registration flows', () => {
  test.skip(!hasAdminCredentials(), 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.');

  test('user can browse event details and register for a free event', async ({ request, page }) => {
    const admin = await loginAdminApi(request);
    const event = await createEvent(request, admin.token, { registration_fee: 0, status: 'published' });
    const user = await registerUser(request);
    await injectToken(page, user.token);

    await page.goto('/user/events');
    await page.getByPlaceholder('Search event name, venue or description').fill(event.title);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText(event.title).first()).toBeVisible();

    const card = page.locator('article').filter({ hasText: event.title });
    await card.getByRole('button', { name: 'View event' }).click();
    await expect(page.getByRole('dialog')).toContainText(event.title);
    await page.getByRole('button', { name: 'Register for free' }).click();
    await expect(page.getByText('Registration confirmed for this free event.')).toBeVisible();

    await page.goto('/user/registrations');
    await expect(page.getByText(event.title).first()).toBeVisible();
    await expect(page.getByText('Your place is confirmed').first()).toBeVisible();
  });

  test('duplicate active registration is rejected by the application', async ({ request, page }) => {
    const admin = await loginAdminApi(request);
    const event = await createEvent(request, admin.token, { registration_fee: 0, status: 'published' });
    const user = await registerUser(request);
    await createRegistration(request, user.token, event.id);
    await injectToken(page, user.token);

    await page.goto('/user/events');
    await page.getByPlaceholder('Search event name, venue or description').fill(event.title);
    await page.getByRole('button', { name: 'Search' }).click();
    const card = page.locator('article').filter({ hasText: event.title });
    await card.getByRole('button', { name: 'View event' }).click();
    await page.getByRole('button', { name: /Register for free|Register for event/ }).click();
    await expect(page.getByRole('alert')).toContainText('already registered');
  });

  test('user can cancel an eligible unpaid registration', async ({ request, page }) => {
    const admin = await loginAdminApi(request);
    const event = await createEvent(request, admin.token, { registration_fee: 10, status: 'published' });
    const user = await registerUser(request);
    await createRegistration(request, user.token, event.id);
    await injectToken(page, user.token);

    await page.goto('/user/registrations');
    const registrationCard = page.locator('article').filter({ hasText: event.title });
    await registrationCard.getByRole('button', { name: 'Cancel unpaid registration' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Cancel registration|Confirm/i }).last().click();
    await expect(page.getByText('Registration cancelled.')).toBeVisible();
    await expect(page.getByText('This registration is cancelled')).toBeVisible();
  });

  test('Paynow initiation is mocked and never contacts the real gateway', async ({ request, page }) => {
    const admin = await loginAdminApi(request);
    const event = await createEvent(request, admin.token, { registration_fee: 12.5, status: 'published' });
    const user = await registerUser(request);
    await createRegistration(request, user.token, event.id);
    await injectToken(page, user.token);

    let initiated = false;
    await page.route('**/api/payments/paynow/initiate', async (route) => {
      initiated = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, redirect_url: 'https://paynow.example/e2e-checkout' }),
      });
    });
    await page.route('https://paynow.example/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Mock Paynow Checkout</h1>' });
    });

    await page.goto('/user/registrations');
    const registrationCard = page.locator('article').filter({ hasText: event.title });
    await registrationCard.getByRole('button', { name: 'Pay with Paynow' }).click();
    await expect.poll(() => initiated).toBeTruthy();
    await expect(page).toHaveURL('https://paynow.example/e2e-checkout');
    await expect(page.getByText('Mock Paynow Checkout')).toBeVisible();
  });
});
