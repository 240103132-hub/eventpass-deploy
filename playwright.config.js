import { defineConfig, devices } from '@playwright/test';

// E2E_BASE_URL set  -> test an already running stack (CI: Docker Compose + PostgreSQL)
// E2E_BASE_URL unset -> start the FastAPI app on port 8100 with an in-memory database
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1, // all tests share one backend and one pool of seats
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: external || 'http://localhost:8100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: external
    ? undefined
    : {
        command: 'python -m uvicorn app.main:app --port 8100',
        cwd: 'backend',
        url: 'http://localhost:8100/api/venues',
        env: { DATABASE_URL: 'memory', STATIC_DIR: '../frontend/dist' },
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
