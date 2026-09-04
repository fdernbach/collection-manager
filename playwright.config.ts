import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:4200',
  },
  // Starts `ng serve` automatically before the tests run, and reuses an
  // already-running dev server locally instead of starting a second one.
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
