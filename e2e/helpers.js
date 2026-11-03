import { expect } from '@playwright/test';

export const BUYER = { name: 'Aisha Zhumabekkyzy', email: 'aisha@sdu.edu.kz' };
export const CARD_OK = '4242 4242 4242 4242';
export const CARD_DECLINED = '4000 0000 0000 0002';
export const STAFF = { email: 'controller@astana.kz', password: 'password123' };

export const digits = (text) => Number(String(text).replace(/\D/g, ''));

// ---------- API helpers: prepare data quickly, without clicking through the UI ----------
export async function listEvents(request) {
  const res = await request.get('/api/events');
  expect(res.ok()).toBeTruthy();
  return res.json();
}

export async function seatEvent(request) {
  const event = (await listEvents(request)).find((e) => e.mode === 'seats');
  expect(event, 'seed data must contain an event with a seat map').toBeTruthy();
  return event;
}

export async function zoneEvent(request) {
  return (await listEvents(request)).find((e) => e.mode !== 'seats');
}

export async function getUnits(request, eventId) {
  const res = await request.get(`/api/events/${eventId}/units`);
  expect(res.ok()).toBeTruthy();
  return res.json();
}

export async function buyTickets(request, event, count = 1, card = CARD_OK) {
  const units = await getUnits(request, event.id);
  let items;
  if (event.mode === 'seats') {
    items = units
      .filter((u) => u.kind === 'seat' && u.status === 'available')
      .slice(0, count)
      .map((u) => ({ unit_id: u.id, quantity: 1 }));
  } else {
    const zone = units.find((u) => u.remaining >= count);
    items = zone ? [{ unit_id: zone.id, quantity: count }] : [];
  }
  expect(items.length, 'enough free places to buy').toBeGreaterThan(0);
  const hold = await request.post(`/api/events/${event.id}/holds`, { data: { items } });
  expect(hold.status()).toBe(201);
  const order = await request.post('/api/orders', {
    data: { hold_id: (await hold.json()).id, customer_name: BUYER.name, customer_email: BUYER.email, card_number: card },
  });
  expect(order.status()).toBe(201);
  return order.json();
}

// ---------- UI helpers ----------
export async function openEvent(page, title) {
  await page.goto('/');
  const card = page.locator('div.rounded-2xl', { has: page.getByRole('heading', { name: title }) });
  await card.getByRole('button', { name: 'Get tickets' }).click();
  await expect(page.getByRole('heading', { name: title, level: 2 })).toBeVisible();
}

// seat buttons carry title="<label> · <price> · <status>"
export const availableSeats = (page) => page.locator('button[title$="available"]');
export const seatByLabel = (page, label) => page.locator(`button[title^="${label} "]`);
export const totalPrice = (page) => page.locator('main b').first();

export async function seatInfo(seat) {
  const [label, price] = (await seat.getAttribute('title')).split(' · ');
  return { label, price: digits(price) };
}

export async function pickSeats(page, count) {
  const seats = availableSeats(page);
  await expect(seats.first()).toBeVisible();
  const picked = [];
  for (let i = 0; i < count; i++) {
    const seat = seats.nth(i); // picked seats stay "available" on the server, so indexes are stable
    picked.push(await seatInfo(seat));
    await seat.click();
  }
  return picked;
}

export async function goToCheckout(page) {
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
}

export async function fillCheckoutForm(page, card) {
  await page.getByPlaceholder('Aisha Zhumabekkyzy').fill(BUYER.name);
  await page.getByPlaceholder('aisha@sdu.edu.kz').fill(BUYER.email);
  await page.getByPlaceholder('4242 4242 4242 4242').fill(card);
}

export const payButton = (page) => page.getByRole('button', { name: /^Pay / });

export async function buyThroughUi(page, request, seatsCount = 1) {
  const event = await seatEvent(request);
  await openEvent(page, event.title);
  const picked = await pickSeats(page, seatsCount);
  await goToCheckout(page);
  await fillCheckoutForm(page, CARD_OK);
  await payButton(page).click();
  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).toBeVisible();
  return { event, picked };
}

export async function loginToScanner(page, eventTitle) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Check-in Scanner' }).click();
  await page.getByPlaceholder('controller@astana.kz').fill(STAFF.email);
  await page.getByPlaceholder('Password').fill(STAFF.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Check-in scanner' })).toBeVisible();
  if (eventTitle) await page.getByRole('combobox').selectOption({ label: eventTitle });
}
