// Halaman terlindungi harus mengalihkan tamu ke /masuk?next=... (PRD §12),
// dan pembeli biasa tidak boleh melihat panel admin (role dicek di server).

import { test, expect } from '@playwright/test';
import { HALAMAN_TERLINDUNGI, HALAMAN_ADMIN } from '../helpers/pages';
import { hasCredentials, alasanLewati, loginAs } from '../helpers/auth';

test.describe('Penjaga login', () => {
  for (const h of HALAMAN_TERLINDUNGI) {
    test(`tamu di ${h.path} dialihkan ke /masuk dengan next`, async ({ page }) => {
      test.skip(!!h.belumAda, 'Halaman belum dibangun (tandai di helpers/pages.ts)');

      await page.goto(h.path, { waitUntil: 'load' });
      await expect(page).toHaveURL(/\/masuk\?/);
      const url = new URL(page.url());
      expect(url.pathname).toBe('/masuk');
      expect(url.searchParams.get('next')).toBe(h.path);
    });
  }
});

test.describe('Penjaga role admin', () => {
  test('pembeli tidak bisa membuka halaman admin', async ({ browser }) => {
    test.skip(HALAMAN_ADMIN.every((h) => h.belumAda), 'Halaman admin belum dibangun');
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));

    const context = await loginAs(browser, 'customer');
    const page = await context.newPage();
    try {
      for (const h of HALAMAN_ADMIN.filter((x) => !x.belumAda)) {
        await page.goto(h.path, { waitUntil: 'load' });
        // Next streaming mengirim status200 sebelum notFound: bukti penolakan
        // adalah tampilan404 dan ketiadaan navigasi/data admin.
        await expect(page.getByRole('heading', { name: /tidak ditemukan/ })).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Navigasi admin' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Menu admin' })).toHaveCount(0);
        await expect(page.getByText('Selamat datang,')).toHaveCount(0);
      }
    } finally {
      await context.close();
    }
  });
});
