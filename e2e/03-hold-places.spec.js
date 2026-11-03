// Issue #14
import { test, expect } from '@playwright/test';
import { seatEvent, openEvent, pickSeats, goToCheckout, seatByLabel } from './helpers.js';

test('selected places are held for 10 minutes and nobody else can take them', async ({ page, browser, request }) => {
  const ev = await seatEvent(request);
  await openEvent(page, ev.title);
  const [seat] = await pickSeats(page, 1);
  await goToCheckout(page);

  // countdown starts at 10:00
  await expect(page.getByText(/Hold expires in (9|10):\d{2}/)).toBeVisible();

  // a second buyer in a separate browser session sees the seat as held and cannot click it
  const other = await browser.newContext({ baseURL: new URL(page.url()).origin });
  const otherPage = await other.newPage();
  await openEvent(otherPage, ev.title);
  const heldSeat = seatByLabel(otherPage, seat.label);
  await expect(heldSeat).toHaveAttribute('title', /held$/);
  await expect(heldSeat).toBeDisabled();
  await other.close();

  // releasing the hold returns the seat to the pool
  await page.getByRole('button', { name: 'Release places and go back' }).click();
  await expect(seatByLabel(page, seat.label)).toHaveAttribute('title', /available$/, { timeout: 12_000 });
});
