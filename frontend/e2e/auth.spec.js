import { test, expect } from '@playwright/test';
import { injectToken, registerUser, uniqueValue } from './helpers/api.js';
import { loginViaUi } from './helpers/ui.js';

test.describe('Authentication and role protection', () => {
  test('user can register through the browser', async ({ page }) => {
    const suffix = uniqueValue('registration');
    const email = `e2e.${suffix}@example.test`;

    await page.goto('/register');
    await page.getByLabel('Full name').fill(`Playwright ${suffix}`);
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('EventoTest!234');
    await page.getByLabel('Confirm password').fill('EventoTest!234');
    await page.getByRole('button', { name: 'Create attendee account' }).click();

    await expect(page).toHaveURL(/\/user\/dashboard$/);
    await expect(page.getByText(/Welcome|Dashboard/i).first()).toBeVisible();
  });

  test('registered user can log in', async ({ request, page }) => {
    const user = await registerUser(request);
    await loginViaUi(page, user.email, user.password);
    await expect(page).toHaveURL(/\/user\/dashboard$/);
  });

  test('unauthenticated visitor is redirected to login', async ({ page }) => {
    await page.goto('/user/events');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('normal user cannot open an admin route', async ({ request, page }) => {
    const user = await registerUser(request);
    await injectToken(page, user.token);
    await page.goto('/admin/events');
    await expect(page).toHaveURL(/\/user\/dashboard$/);
  });
});
