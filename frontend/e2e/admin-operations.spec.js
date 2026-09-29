import { test, expect } from '@playwright/test';
import {
  createEvent,
  createRegistration,
  hasAdminCredentials,
  loginAdminApi,
  registerUser,
} from './helpers/api.js';
import { loginAdminViaUi } from './helpers/ui.js';

test.describe('Admin operational workspaces', () => {
  test.skip(!hasAdminCredentials(), 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.');

  test('admin can find a registration and confirm a manual payment', async ({ request, page }) => {
    const admin = await loginAdminApi(request);
    const event = await createEvent(request, admin.token, { registration_fee: 18, status: 'published' });
    const user = await registerUser(request);
    await createRegistration(request, user.token, event.id);

    await loginAdminViaUi(page);
    await page.goto('/admin/registrations');
    await page.getByPlaceholder('Search attendee, email, event or venue').fill(user.email);
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(user.email).first()).toBeVisible();

    const cardOrRow = page.locator('tr').filter({ hasText: user.email });
    await cardOrRow.getByRole('button', { name: 'Confirm offline payment' }).click();
    const dialog = page.getByRole('dialog', { name: 'Confirm payment' });
    await dialog.getByText('Manual payment', { exact: true }).click();
    await dialog.getByPlaceholder('Receipt, voucher or other reference').fill(`E2E-RECEIPT-${Date.now()}`);
    await dialog.getByPlaceholder('Add any verification notes that should remain with the payment audit trail.').fill('Confirmed by Playwright E2E test.');
    await dialog.getByRole('button', { name: 'Confirm received payment' }).click();
    await expect(page.getByText(/confirmed/i).first()).toBeVisible();

    await page.goto('/admin/payments');
    await expect(page.getByText(user.email).first()).toBeVisible();
    await expect(page.getByText('Manual payment').first()).toBeVisible();
  });

  test('admin registrations, payments and reports pages load', async ({ page }) => {
    await loginAdminViaUi(page);

    await page.goto('/admin/registrations');
    await expect(page.getByRole('heading', { name: 'Registration management' })).toBeVisible();

    await page.goto('/admin/payments');
    await expect(page.getByText(/payment/i).first()).toBeVisible();

    await page.goto('/admin/reports');
    await expect(page.getByRole('button', { name: 'Generate report' })).toBeVisible();
    await page.getByRole('button', { name: 'Generate report' }).click();
    await expect(page.getByText('Event performance')).toBeVisible();
    await expect(page.getByText('Registration report')).toBeVisible();
    await expect(page.getByText('Payment report')).toBeVisible();
  });

  test('admin can promote a user and reset their password', async ({ request, page }) => {
    const user = await registerUser(request);
    await loginAdminViaUi(page);
    await page.goto('/admin/users');

    await page.getByPlaceholder('Search name, email or user ID').fill(user.email);
    await page.getByRole('button', { name: /Apply|Search/i }).click();
    const row = page.locator('tr').filter({ hasText: user.email });
    await row.getByRole('button', { name: 'Make admin' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Make administrator' }).click();
    await expect(page.getByText(/is now an Administrator/i)).toBeVisible();

    const updated = page.locator('tr').filter({ hasText: user.email });
    await updated.getByRole('button', { name: 'Reset password' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reset password' }).last().click();
    const tempDialog = page.getByRole('dialog', { name: 'Temporary password created' });
    await expect(tempDialog).toBeVisible();
    const temporaryPassword = await tempDialog.locator('code').textContent();
    expect(temporaryPassword?.length).toBeGreaterThanOrEqual(8);
  });
});
