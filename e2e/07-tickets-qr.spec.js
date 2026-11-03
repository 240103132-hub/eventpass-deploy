// Issue #18
import { test, expect } from '@playwright/test';
import { buyThroughUi, BUYER } from './helpers.js';

test('after payment every ticket is shown with a QR code and a real ticket code', async ({ page, request }) => {
  const { event } = await buyThroughUi(page, request, 2);

  await expect(page.getByText(event.title).first()).toBeVisible();
  await expect(page.getByText(BUYER.name).first()).toBeVisible();

  const qrCodes = page.locator('canvas');
  await expect(qrCodes).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const box = await qrCodes.nth(i).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(100);
  }

  const codes = await page.getByText(/^TKT-\S+$/).allTextContents();
  expect(codes).toHaveLength(2);
  for (const code of codes) {
    const res = await request.get(`/api/tickets/${code}`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).code).toBe(code);
  }
});
