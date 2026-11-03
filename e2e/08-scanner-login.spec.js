// Issue #19
import { test, expect } from '@playwright/test';
import { STAFF } from './helpers.js';

async function openScanner(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Check-in Scanner' }).click();
}

async function login(page, password) {
  await page.getByPlaceholder('controller@astana.kz').fill(STAFF.email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

test.describe('Scanner staff login', () => {
  test('scanner asks for a login first', async ({ page }) => {
    await openScanner(page);
    await expect(page.getByRole('heading', { name: 'Staff login' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Check-in scanner' })).toHaveCount(0);
  });

  test('wrong password shows an error and stays on the login form', async ({ page }) => {
    await openScanner(page);
    await login(page, 'definitely-wrong');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Staff login' })).toBeVisible();
  });

  test('valid login opens the scanner, the session survives a reload, logout works', async ({ page }) => {
    await openScanner(page);
    await login(page, STAFF.password);
    await expect(page.getByRole('heading', { name: 'Check-in scanner' })).toBeVisible();
    await expect(page.getByRole('button', { name: `Log out (${STAFF.email})` })).toBeVisible();

    await page.reload();
    await openScanner(page);
    await expect(page.getByRole('heading', { name: 'Check-in scanner' })).toBeVisible();

    await page.getByRole('button', { name: /^Log out/ }).click();
    await expect(page.getByRole('heading', { name: 'Staff login' })).toBeVisible();
  });
});
