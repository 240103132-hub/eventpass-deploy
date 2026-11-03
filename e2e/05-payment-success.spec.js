// Issue #16
import { test, expect } from '@playwright/test';
import {
  seatEvent, openEvent, pickSeats, goToCheckout, fillCheckoutForm, payButton, getUnits,
  digits, BUYER, CARD_OK,
} from './helpers.js';

test('paying with card 4242 confirms the booking and marks the seats as sold', async ({ page, request }) => {
  const ev = await seatEvent(request);
  await openEvent(page, ev.title);
  const picked = await pickSeats(page, 2);
  const expected = picked.reduce((sum, s) => sum + s.price, 0);

  await goToCheckout(page);
  expect(digits(await payButton(page).textContent())).toBe(expected); // pay button shows the real total

  await fillCheckoutForm(page, CARD_OK);
  await payButton(page).click();

  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).toBeVisible();
  await expect(page.getByText(`confirmation sent to ${BUYER.email}`)).toBeVisible();

  const units = await getUnits(request, ev.id);
  for (const seat of picked) {
    expect(units.find((u) => u.label === seat.label).status).toBe('sold');
  }
});
