import { test, expect } from '@playwright/test';
import { futureDate, hasAdminCredentials, uniqueValue } from './helpers/api.js';
import { loginAdminViaUi } from './helpers/ui.js';

test.describe('Admin event management', () => {
  test.skip(!hasAdminCredentials(), 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.');

  test('admin can create, edit, publish, close and delete an event', async ({ page }) => {
    const suffix = uniqueValue('crud');
    const title = `E2E CRUD ${suffix}`;
    const updatedTitle = `${title} Updated`;

    await loginAdminViaUi(page);
    await page.goto('/admin/events');
    await page.getByRole('button', { name: 'Create event' }).click();

    const dialog = page.getByRole('dialog', { name: /Create event/i });
    await dialog.getByPlaceholder('e.g. Software Engineering Research Symposium').fill(title);
    await dialog.getByPlaceholder('Explain what attendees can expect from this event.').fill('Created by Playwright for CRUD validation.');
    await dialog.getByPlaceholder('Venue or meeting location').fill('Playwright Hall');
    await dialog.locator('input[type="date"]').fill(futureDate(40));
    await dialog.locator('input[type="time"]').fill('09:30');
    await dialog.locator('input[type="number"]').nth(0).fill('0');
    await dialog.locator('input[type="number"]').nth(1).fill('20');
    await dialog.locator('select').selectOption('draft');
    await dialog.getByRole('button', { name: /Create event|Save event/i }).click();
    await expect(page.getByText('Event created successfully.')).toBeVisible();

    await page.getByPlaceholder('Search title, venue or description').fill(title);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    let row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: `Edit ${title}` }).click();
    const editDialog = page.getByRole('dialog', { name: /Edit event/i });
    await editDialog.getByPlaceholder('e.g. Software Engineering Research Symposium').fill(updatedTitle);
    await editDialog.getByRole('button', { name: /Save changes|Save event|Update event/i }).click();
    await expect(page.getByText('Event updated successfully.')).toBeVisible();

    await page.getByPlaceholder('Search title, venue or description').fill(updatedTitle);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    row = page.getByRole('row').filter({ hasText: updatedTitle });
    await row.getByRole('button', { name: 'Publish' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publish event' }).click();
    await expect(page.getByText('Event published successfully.')).toBeVisible();

    row = page.getByRole('row').filter({ hasText: updatedTitle });
    await row.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Close event' }).click();
    await expect(page.getByText('Event closed successfully.')).toBeVisible();

    row = page.getByRole('row').filter({ hasText: updatedTitle });
    await row.getByRole('button', { name: `Delete ${updatedTitle}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete event' }).click();
    await expect(page.getByText('Event deleted successfully.')).toBeVisible();
  });
});
