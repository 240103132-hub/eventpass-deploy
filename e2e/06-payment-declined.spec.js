// Issue #17
import { test, expect } from '@playwright/test';
import {
  seatEvent, openEvent, pickSeats, goToCheckout, fillCheckoutForm, payButton, getUnits,
  CARD_DECLINED, CARD_OK,
} from './helpers.js';

test('declined card shows an error, keeps the hold and issues no ticket', async ({ page, request }) => {
  const ev = await seatEvent(request);
  await openEvent(page, ev.title);
  const [seat] = await pickSeats(page, 1);
  await goToCheckout(page);

  await fillCheckoutForm(page, CARD_DECLINED);
  await payButton(page).click();

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await expect(page.getByText(/Hold expires in/)).toBeVisible();

  const units = await getUnits(request, ev.id);
  expect(units.find((u) => u.label === seat.label).status).toBe('held'); // not sold

  // the hold is still valid: paying with a good card now succeeds
  await page.getByPlaceholder('4242 4242 4242 4242').fill(CARD_OK);
  await payButton(page).click();
  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).toBeVisible();
});
