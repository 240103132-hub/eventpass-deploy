// Issue #13
import { test, expect } from '@playwright/test';
import { seatEvent, zoneEvent, openEvent, availableSeats, pickSeats, totalPrice, digits } from './helpers.js';

test.describe('Seat map and zone ticket selection', () => {
  test('seat map: picking and un-picking seats updates the counter and the total', async ({ page, request }) => {
    const ev = await seatEvent(request);
    await openEvent(page, ev.title);

    await expect(page.getByText('STAGE')).toBeVisible();
    await expect(page.getByText(/VIP rows/)).toBeVisible();

    const checkout = page.getByRole('button', { name: 'Proceed to checkout' });
    await expect(checkout).toBeDisabled();
    await expect(page.getByText('0 of 8 tickets')).toBeVisible();

    const picked = await pickSeats(page, 2);
    const expected = picked.reduce((sum, s) => sum + s.price, 0);
    await expect(page.getByText('2 of 8 tickets')).toBeVisible();
    expect(digits(await totalPrice(page).textContent())).toBe(expected);
    await expect(checkout).toBeEnabled();

    await availableSeats(page).nth(0).click(); // click a picked seat again to un-pick it
    await expect(page.getByText('1 of 8 tickets')).toBeVisible();
  });

  test('zone event: + and - change the quantity and the total', async ({ page, request }) => {
    const ev = await zoneEvent(request);
    test.skip(!ev, 'seed data has no zone-based event');
    await openEvent(page, ev.title);

    const plus = page.getByRole('button', { name: '+', exact: true }).first();
    const minus = page.getByRole('button', { name: '\u2212', exact: true }).first();

    await plus.click();
    await plus.click();
    await expect(page.getByText('2 of 8 tickets')).toBeVisible();
    expect(digits(await totalPrice(page).textContent())).toBeGreaterThan(0);

    await minus.click();
    await expect(page.getByText('1 of 8 tickets')).toBeVisible();
  });
});
