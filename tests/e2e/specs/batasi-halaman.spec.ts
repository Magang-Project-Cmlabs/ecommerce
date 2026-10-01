// Kartu kvnlhm · Hari 2 · Batasi halaman yang butuh login.
// Melengkapi auth-guard.spec.ts (tamu → /masuk?next=, pembeli ditolak di /admin).

import { test, expect } from '@playwright/test';
import { alasanLewati, hasCredentials, loginAs } from '../helpers/auth';

test.describe('Batasi halaman yang butuh login', () => {
  test('tamu dialihkan ke /masuk, lalu setelah masuk kembali ke halaman asal', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    await page.goto('/akun', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/masuk\?next=%2Fakun$/);

    await page.getByLabel('Email').fill(process.env.E2E_CUSTOMER_EMAIL!);
    await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_CUSTOMER_PASSWORD!);
    await page.getByRole('button', { name: /^masuk$/i }).click();

    await page.waitForURL((u) => u.pathname === '/akun');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pengaturan Akun');
  });

  test('query ikut dibawa di next', async ({ page }) => {
    await page.goto('/checkout?langkah=2', { waitUntil: 'load' });
    const url = new URL(page.url());
    expect(url.pathname).toBe('/masuk');
    expect(url.searchParams.get('next')).toBe('/checkout?langkah=2');
  });

  test('cookie sesi palsu tidak dianggap masuk', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'tokokita_sesi', value: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0.', url: baseURL! }]);
    for (const halaman of ['/admin', '/wishlist']) {
      await page.goto(halaman, { waitUntil: 'load' });
      expect(new URL(page.url()).pathname, `${halaman} dengan cookie palsu`).toBe('/masuk');
    }
  });

  test('admin bisa membuka panel admin', async ({ browser }) => {
    test.skip(!hasCredentials('admin'), alasanLewati('admin'));
    const context = await loginAs(browser, 'admin');
    const page = await context.newPage();
    try {
      const res = await page.goto('/admin', { waitUntil: 'load' });
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ringkasan toko');
    } finally {
      await context.close();
    }
  });

  test('pembeli yang membuka /admin mendapat 404, bukan panel admin', async ({ browser }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    const context = await loginAs(browser, 'customer');
    const page = await context.newPage();
    try {
      await page.goto('/admin', { waitUntil: 'load' });
      await expect(page.getByRole('heading', { name: /tidak ditemukan/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Ringkasan toko' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});
