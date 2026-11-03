// Issue #15
import { test, expect } from '@playwright/test';
import { seatEvent, openEvent, availableSeats, getUnits } from './helpers.js';

test.describe('Maximum 8 tickets per order', () => {
  test('UI blocks the 9th ticket with a message', async ({ page, request }) => {
    const ev = await seatEvent(request);
    await openEvent(page, ev.title);

    const seats = availableSeats(page);
    await expect(seats.first()).toBeVisible();
    expect(await seats.count()).toBeGreaterThanOrEqual(9);

    for (let i = 0; i < 8; i++) await seats.nth(i).click();
    await expect(page.getByText('8 of 8 tickets')).toBeVisible();

    await seats.nth(8).click();
    await expect(page.getByRole('alert')).toContainText('at most 8 tickets');
    await expect(page.getByText('8 of 8 tickets')).toBeVisible(); // still 8, not 9
  });

  test('API also rejects a hold with more than 8 tickets', async ({ request }) => {
    const ev = await seatEvent(request);
    const units = await getUnits(request, ev.id);
    const items = units
      .filter((u) => u.kind === 'seat' && u.status === 'available')
      .slice(0, 9)
      .map((u) => ({ unit_id: u.id, quantity: 1 }));
    expect(items).toHaveLength(9);

    const res = await request.post(`/api/events/${ev.id}/holds`, { data: { items } });
    expect(res.ok()).toBeFalsy();
    expect(['limit_exceeded', 'validation_error']).toContain((await res.json()).code);
  });
});
