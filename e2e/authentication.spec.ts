import { test, expect } from '@playwright/test';

// Unlike collection-manager.spec.ts, these tests deliberately do NOT start from a
// logged-in session — they exercise the login flow itself, the route guard, and logout,
// against the real backend (angular-collection-management-backend/server.js).
test.describe('Authentication', () => {
  test('shows "Invalid credentials" and stays on /login when the password is wrong', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formcontrolname="username"]', 'admin');
    await page.fill('input[formcontrolname="password"]', 'wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('redirects an unauthenticated visit to /collection back to /login', async ({ page }) => {
    await page.goto('/collection');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('logs in, shows the nav, and logging out clears the session and redirects to /login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[formcontrolname="username"]', 'admin');
    await page.fill('input[formcontrolname="password"]', 'admin1234');
    await page.getByRole('button', { name: 'Login' }).click();
    // Lands on /collection, then MainMenu's loadSelectedCollection() redirects
    // to /collection/:id once it resolves which collection to show.
    await page.waitForURL('**/collection**');

    await expect(page.locator('nav .avatar')).toHaveText('S');
    await expect(page.locator('nav header')).toContainText('Super Admin');

    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('TOKEN'))).toBeNull();

    // Confirm the session is really gone, not just the URL at this instant —
    // a protected route should bounce back to /login again, not just this once.
    await page.goto('/collection');
    await expect(page).toHaveURL(/\/login$/);
  });
});
