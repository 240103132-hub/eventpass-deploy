// Issue #20
import { test, expect } from '@playwright/test';
import { listEvents, buyTickets, loginToScanner } from './helpers.js';

async function scan(page, code) {
  await page.getByPlaceholder(/Type ticket code/).fill(code);
  await page.getByRole('button', { name: 'Check', exact: true }).click();
}

// the big coloured box: first <div> inside role=status holds the verdict, e.g. "ALREADY USED"
const verdict = (page) => page.getByRole('status').locator('div').first();

// the scanner staff controller@astana.kz only sees events of the Astana venue
async function astanaEvents(request) {
  const events = (await listEvents(request)).filter((e) => e.city === 'Astana');
  expect(events.length).toBeGreaterThan(0);
  return events;
}

test.describe('Scanner ticket check-in', () => {
  test('first scan is VALID, second scan of the same ticket is ALREADY USED', async ({ page, request }) => {
    const [ev] = await astanaEvents(request);
    const order = await buyTickets(request, ev, 1);
    await loginToScanner(page, ev.title);

    await scan(page, order.tickets[0].code);
    await expect(verdict(page)).toHaveText('VALID');

    await scan(page, order.tickets[0].code);
    await expect(verdict(page)).toHaveText('ALREADY USED');
  });

  test('unknown ticket code is INVALID', async ({ page, request }) => {
    const [ev] = await astanaEvents(request);
    await loginToScanner(page, ev.title);
    await scan(page, 'TKT-DOES-NOT-EXIST');
    await expect(verdict(page)).toHaveText('INVALID');
  });

  test('ticket for another event is WRONG EVENT', async ({ page, request }) => {
    const events = await astanaEvents(request);
    test.skip(events.length < 2, 'needs two events in the same venue');
    const order = await buyTickets(request, events[1], 1);
    await loginToScanner(page, events[0].title);
    await scan(page, order.tickets[0].code);
    await expect(verdict(page)).toHaveText('WRONG EVENT');
  });

  test('ticket of a cancelled order is CANCELLED', async ({ page, request }) => {
    const [ev] = await astanaEvents(request);
    const order = await buyTickets(request, ev, 1);
    const cancel = await request.post(`/api/orders/${order.order_code}/cancel`);
    expect(cancel.ok()).toBeTruthy();

    await loginToScanner(page, ev.title);
    await scan(page, order.tickets[0].code);
    await expect(verdict(page)).toHaveText('CANCELLED');
  });
});
