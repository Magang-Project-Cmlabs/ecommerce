// Sapu semua halaman: tiap halaman terbuka tanpa galat HTTP, tanpa error
// JavaScript, dan punya tepat satu <h1>. Perubahan di layout atau komponen
// bersama sering merusak halaman yang tidak disangka — tes ini yang menangkapnya.

import { test, expect, type BrowserContext } from '@playwright/test';
import { HALAMAN_PUBLIK, HALAMAN_PEMBELI, HALAMAN_ADMIN, type Halaman } from '../helpers/pages';
import { tangkapError, bukaHalaman, cekSatuH1 } from '../helpers/cek';
import { hasCredentials, alasanLewati, loginAs, POLA_MASUK, type Peran } from '../helpers/auth';

function sapu(daftar: Halaman[], peran?: Peran) {
  let context: BrowserContext | undefined;

  if (peran) {
    test.beforeAll(async ({ browser }) => {
      if (!hasCredentials(peran)) return;
      if (daftar.every((h) => h.belumAda)) return;
      context = await loginAs(browser, peran);
    });
    test.afterAll(async () => {
      await context?.close();
    });
  }

  for (const h of daftar) {
    test(`${h.judul} (${h.path})`, async ({ page: pageTamu }) => {
      test.skip(!!h.belumAda, 'Halaman belum dibangun (tandai di helpers/pages.ts)');
      if (peran) test.skip(!hasCredentials(peran), alasanLewati(peran));

      const page = context ? await context.newPage() : pageTamu;
      const errors = tangkapError(page);

      await bukaHalaman(page, h.path);
      if (peran) expect(page.url(), 'sesi tidak berlaku, dialihkan ke /masuk').not.toMatch(POLA_MASUK);
      await cekSatuH1(page);
      expect(errors).toEqual([]);

      if (context) await page.close();
    });
  }
}

test.describe('Navigasi · publik', () => sapu(HALAMAN_PUBLIK));
test.describe('Navigasi · pembeli', () => sapu(HALAMAN_PEMBELI, 'customer'));
test.describe('Navigasi · admin', () => sapu(HALAMAN_ADMIN, 'admin'));

test('Detail produk pertama dari daftar produk terbuka', async ({ page }) => {
  const daftar = HALAMAN_PUBLIK.find((h) => h.path === '/produk');
  test.skip(!!daftar?.belumAda, 'Halaman daftar produk belum dibangun');

  const errors = tangkapError(page);
  await bukaHalaman(page, '/produk');
  const tautan = page.locator('a[href^="/produk/"]').first();
  await expect(tautan, 'tidak ada produk di /produk — sudah menjalankan db:reset?').toBeVisible();
  await tautan.click();
  await page.waitForURL(/\/produk\/[^/?#]+/);
  await cekSatuH1(page);
  expect(errors).toEqual([]);
});
