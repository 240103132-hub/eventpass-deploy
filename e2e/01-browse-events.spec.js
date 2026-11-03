// Issue #12
import { test, expect } from '@playwright/test';
import { listEvents, openEvent } from './helpers.js';

test.describe('Browse events', () => {
  test('catalog lists every upcoming event with venue, date and price', async ({ page, request }) => {
    const events = await listEvents(request);
    expect(events.length).toBeGreaterThan(0);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Upcoming events' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(events.length);

    for (const ev of events) {
      const card = page.locator('div.rounded-2xl', { has: page.getByRole('heading', { name: ev.title }) });
      await expect(card).toContainText(ev.venue_name);
      await expect(card).toContainText('from');
      await expect(card.getByRole('button', { name: 'Get tickets' })).toBeEnabled();
    }
  });

  test('search by title filters the list and shows an empty state', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search by title').fill('Almaty');
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: /Almaty Tech/ })).toBeVisible();

    await page.getByPlaceholder('Search by title').fill('zzz-no-such-event');
    await expect(page.getByText('No events found.')).toBeVisible();
  });

  test('city filter shows only events of that city', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
    await page.getByRole('combobox').selectOption('Almaty');
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: /Almaty Tech/ })).toBeVisible();
  });

  test('opening an event shows its details and a way back', async ({ page, request }) => {
    const [ev] = await listEvents(request);
    await openEvent(page, ev.title);
    await expect(page.getByText(`${ev.venue_name}, ${ev.city}`)).toBeVisible();

    await page.getByRole('button', { name: 'Back to events' }).click();
    await expect(page.getByRole('heading', { name: 'Upcoming events' })).toBeVisible();
  });
});
