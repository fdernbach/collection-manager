import { test, expect } from '@playwright/test';
import path from 'node:path';

const sampleImage = path.join(__dirname, 'fixtures', 'sample-image.png');
// Direct backend calls (bypassing the Angular UI) to seed known test data. The app
// itself talks to this same server (see CollectionService/CollectionItemService's
// baseURL) — it's just not reachable through playwright.config.ts's baseURL, which
// points at the Angular dev server instead.
const BACKEND_URL = 'http://localhost:3000';

const seedItems = [
  { name: 'Pièce de 1972', description: 'Pièce de 50 centimes de francs.', image: 'img/coin1.png', rarity: 'Common', price: 170 },
  { name: 'Linx', description: 'A legendary sword of unmatched sharpness and history.', image: 'img/linx2.png', rarity: 'Legendary', price: 199 },
  { name: 'Timbre 1800', description: 'Un vieux timbre', image: 'img/timbre1.png', rarity: 'Rare', price: 555 },
];

// End-to-end tests: unlike the integration tests under src/app/**/*.spec.ts (which run
// components inside Angular's TestBed), these drive the real app running in a real
// browser via `ng serve` (see playwright.config.ts's webServer), exactly as a user would.
test.describe('Collection Manager', () => {
  // These tests all seed/mutate the SAME admin collection in the real backend (there's
  // no per-test database, unlike the TestBed-based integration specs). Running them in
  // parallel workers (the config's default `fullyParallel`) would let one test's
  // beforeEach wipe/reseed items out from under another test still reading them —
  // serial keeps them from racing each other.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, request }) => {
    // '/collection' and '/item' are guarded by isLoggedInGuard, so every test needs a
    // real session first — log in against the actual backend (admin/admin1234, seeded
    // by angular-collection-management-backend/server.js) before anything else.
    await page.goto('/login');
    await page.fill('input[formcontrolname="username"]', 'admin');
    await page.fill('input[formcontrolname="password"]', 'admin1234');
    await page.getByRole('button', { name: 'Login' }).click();
    // Lands on /collection, then MainMenu's loadSelectedCollection() redirects
    // to /collection/:id once it resolves which collection to show. Wait for the
    // id specifically (not just '**/collection**', which would also match the
    // brief intermediate /collection with no id yet) since it's read below.
    await page.waitForURL(/\/collection\/\d+$/);

    // Start every test from a known state. Unlike the old localStorage-backed
    // CollectionService (which reseeded 3 dummy items on its own), the real backend's
    // admin collection just accumulates whatever earlier runs left in it — so wipe
    // its items and recreate exactly the 3 this suite expects, via direct API calls
    // authenticated with the token the login above just stored.
    const token = await page.evaluate(() => localStorage.getItem('TOKEN'));
    const authHeaders = { Authorization: `Bearer ${token}` };
    const collectionId = page.url().match(/\/collection\/(\d+)$/)?.[1];

    const collection = await (
      await request.get(`${BACKEND_URL}/collections/${collectionId}`, { headers: authHeaders })
    ).json();
    for (const item of collection.items) {
      await request.delete(`${BACKEND_URL}/items/${item.id}`, { headers: authHeaders });
    }
    for (const item of seedItems) {
      await request.post(`${BACKEND_URL}/items`, { headers: authHeaders, data: { ...item, collectionId } });
    }

    // The page already fetched the (now stale) collection before the seeding above; reload
    // so it reflects the freshly seeded items.
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

    await expect(page).toHaveURL(/\/collection\/\d+$/);
    await expect(page.getByText('Ancient Coin')).toBeVisible();
    await expect(page.getByText('Found 4 items')).toBeVisible();
  });

  test('editing an item and clicking Cancel discards changes', async ({ page }) => {
    await page.getByText('Linx').click();
    await expect(page).toHaveURL(/\/item\/\d+$/);

    await page.fill('#name', 'Something else entirely');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/collection\/\d+$/);
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

    await expect(page).toHaveURL(/\/collection\/\d+$/);
    await expect(page.getByText('Timbre 1800')).toHaveCount(0);
    await expect(page.getByText('Found 2 items')).toBeVisible();
  });
});
