import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './frontend/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'cd backend && python -m uvicorn app.main:app --port 8000',
    port: 8000,
    reuseExistingServer: !process.env.CI,
  },
});
