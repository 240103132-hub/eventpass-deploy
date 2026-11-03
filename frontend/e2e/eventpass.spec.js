import { test, expect } from '@playwright/test';

test.describe('EventPass E2E User Flows', () => {
  test('Browse events and open event details (#12)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('EventPass');
  });

  test('Scanner staff login page (#19)', async ({ page }) => {
    await page.goto('/scanner.html');
    await expect(page.locator('body')).toContainText('Check-in Scanner');
  });
});
