import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.E2E_BASE_URL || 'http://localhost:5173';
const backendUrl = process.env.E2E_API_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run dev -- --host localhost',
      url: frontendUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm --prefix ../backend run dev',
      url: `${backendUrl}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
