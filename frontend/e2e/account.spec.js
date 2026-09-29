import { test, expect } from '@playwright/test';
import { injectToken, registerUser, uniqueValue } from './helpers/api.js';

test.describe('Self-service account management', () => {
  test('user can update profile information and change password', async ({ request, page }) => {
    const user = await registerUser(request);
    await injectToken(page, user.token);
    await page.goto('/account');

    const updatedName = `Updated ${uniqueValue('profile')}`;
    await page.getByLabel('Full name').fill(updatedName);
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText(/profile.*updated|updated successfully/i)).toBeVisible();

    const newPassword = 'EventoChanged!456';
    await page.getByLabel('Current password').fill(user.password);
    await page.getByLabel('New password').fill(newPassword);
    await page.getByLabel('Confirm new password').fill(newPassword);
    await page.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText(/password.*changed|changed successfully/i)).toBeVisible();
  });

  test('user can delete their account', async ({ request, page }) => {
    const user = await registerUser(request);
    await injectToken(page, user.token);
    await page.goto('/account');

    await page.getByLabel('Current password to confirm deletion').fill(user.password);
    await page.getByRole('button', { name: 'Delete my account' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Delete account|Confirm deletion|Delete my account/i }).last().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/account has been deleted/i)).toBeVisible();
  });
});
