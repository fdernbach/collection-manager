import { test, expect } from '@playwright/test';
import path from 'node:path';

const sampleImage = path.join(__dirname, 'fixtures', 'sample-image.png');

// End-to-end tests: unlike the integration tests under src/app/**/*.spec.ts (which run
// components inside Angular's TestBed), these drive the real app running in a real
// browser via `ng serve` (see playwright.config.ts's webServer), exactly as a user would.
test.describe('Collection Manager', () => {
  test.beforeEach(async ({ page }) => {
    // '/home' and '/item' are guarded by isLoggedInGuard, so every test needs a real
    // session first — log in against the actual backend (admin/admin1234, seeded by
    // angular-collection-management-backend/server.js) before anything else.
    await page.goto('/login');
    await page.fill('input[formcontrolname="username"]', 'admin');
    await page.fill('input[formcontrolname="password"]', 'admin1234');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/home');

    // Start every test from a clean slate: clear whatever a previous run left in the
    // (separate, localStorage-backed) CollectionService state, then reload so it
    // reseeds its 3 dummy items. Only that key is removed, not the whole of
    // localStorage, so the auth token from the login above survives the reload.
    await page.evaluate(() => localStorage.removeItem('collections'));
    await page.reload();
  });

  test('shows the 3 seeded items on the home page', async ({ page }) => {
    await expect(page.locator('.item-name')).toHaveText(['Pièce de 1972', 'Linx', 'Timbre 1800']);
    await expect(page.getByText('Found 3 items')).toBeVisible();
  });

  test('filters the grid as the user types in the search box', async ({ page }) => {
    await page.fill('#live-search', 'timbre');
    await expect(page.locator('.item-name')).toHaveText(['Timbre 1800']);
  });

  test('creates a new item and shows it back on the home page', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(page).toHaveURL(/\/item$/);

    await page.fill('#name', 'Ancient Coin');
    await page.fill('#description', 'A very old coin');
    await page.locator('#image').setInputFiles(sampleImage);
    await page.fill('#price', '99');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText('Ancient Coin')).toBeVisible();
    await expect(page.getByText('Found 4 items')).toBeVisible();
  });

  test('editing an item and clicking Cancel discards changes', async ({ page }) => {
    await page.getByText('Linx').click();
    await expect(page).toHaveURL(/\/item\/\d+$/);

    await page.fill('#name', 'Something else entirely');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText('Linx')).toBeVisible();
    await expect(page.getByText('Something else entirely')).toHaveCount(0);
  });

  test('deleting an item asks for confirmation, and "No" keeps it', async ({ page }) => {
    await page.getByText('Timbre 1800').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Confirm deletion')).toBeVisible();

    await page.getByRole('button', { name: 'No' }).click();
    await expect(page.getByText('Confirm deletion')).toHaveCount(0);
    await expect(page).toHaveURL(/\/item\/\d+$/);
  });

  test('deleting an item and confirming with "Yes" removes it', async ({ page }) => {
    await page.getByText('Timbre 1800').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText('Timbre 1800')).toHaveCount(0);
    await expect(page.getByText('Found 2 items')).toBeVisible();
  });
});
