import { expect } from '@playwright/test';
import { adminCredentials } from './api.js';

export async function loginViaUi(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function loginAdminViaUi(page) {
  const { email, password } = adminCredentials();
  if (!email || !password) {
    throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD before running admin Playwright tests.');
  }
  await loginViaUi(page, email, password);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}
