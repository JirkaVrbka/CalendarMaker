import { defineConfig, devices } from '@playwright/test'

// End-to-end tests for key flows (upload image → build calendar → export PDF).
// Run with `npm run e2e`. Browsers must be installed once: `npx playwright install`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Vite dev server is started for the test run; reused locally if already up.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
