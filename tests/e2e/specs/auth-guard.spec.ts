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
        const response = await page.goto(h.path, { waitUntil: 'load' });
        const dialihkan = !new URL(page.url()).pathname.startsWith('/admin');
        const ditolak = !!response && [403, 404].includes(response.status());
        expect(dialihkan || ditolak, `${h.path} terbuka untuk pembeli (status ${response?.status()})`).toBe(true);
      }
    } finally {
      await context.close();
    }
  });
});
