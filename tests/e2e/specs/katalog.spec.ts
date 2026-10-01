import { test, expect } from '@playwright/test';
import { performLogin, hasCredentials } from '../helpers/auth';

test('pencarian 2 huruf memberi saran nyata dan keyboard membuka detail', async ({ page, request }) => {
  const api = await request.get('/api/search?q=ka');
  expect(api.status()).toBe(200); const { products } = await api.json();
  expect(products.length).toBeGreaterThan(0); expect(products.length).toBeLessThanOrEqual(6);
  expect((await (await request.get('/api/search?q=k')).json()).products).toEqual([]);
  await page.goto('/'); await page.getByRole('combobox', { name: 'Cari produk, merek...' }).fill('ka');
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Cari produk, merek...' }).press('ArrowDown');
  await page.getByRole('combobox', { name: 'Cari produk, merek...' }).press('Enter');
  await expect(page).toHaveURL(/\/produk\/[a-z-]+/); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
test('filter URL, list, pagination dan hasil kosong', async ({ page }) => {
  await page.goto('/produk'); await expect(page.getByRole('navigation', { name: 'Halaman produk' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Halaman produk' }).getByRole('link', { name: '2', exact: true }).click();
  await expect(page).toHaveURL(/hal=2/);
  await page.getByLabel('Urutkan produk').selectOption('termurah'); await expect(page).toHaveURL(/urut=termurah/);
  await page.getByRole('radio', { name: 'Tampilan list' }).click(); await expect(page).toHaveURL(/tampilan=list/);
  await page.goto('/produk?q=zzzproduk-tidak-ada'); await expect(page.getByText('Produk tidak ditemukan. Coba kata kunci lain.', { exact: true })).toBeVisible();
});
test('produk varian wajib dipilih, stok habis terkunci, keranjang memakai ID nyata', async ({ page }) => {
  await page.goto('/produk/kaos-polos-premium');
  await page.getByRole('button', { name: 'Masukkan Keranjang' }).click(); await expect(page.getByText('Pilih ukuran terlebih dahulu.', { exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'XL, habis', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'M', exact: true }).click(); await expect(page.getByText(/Tersedia \d+ barang/)).toBeVisible();
  await page.getByRole('button', { name: 'Masukkan Keranjang' }).click(); await expect(page.getByRole('dialog')).toBeVisible();
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem('tokokita-cart') || '{}').state.items);
  expect(items[0].slug).toBe('kaos-polos-premium'); expect(items[0].variantId).toBeGreaterThan(0); expect(items[0].variantName).toBe('M');
});
test('zoom galeri, spesifikasi, metadata produk dan sitemap', async ({ page, request }) => {
  await page.goto('/produk/speaker-bluetooth-mini'); await page.getByRole('button', { name: 'Perbesar foto Speaker Bluetooth Mini' }).click();
  await expect(page.getByRole('button', { name: 'Tutup', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.getByRole('tab', { name: 'Spesifikasi' }).click(); await expect(page.getByRole('heading', { name: 'Spesifikasi Produk' })).toBeVisible();
  await expect(page).toHaveTitle('Speaker Bluetooth Mini — TokoKita'); const schema = await page.locator('script[type="application/ld+json"]').textContent(); expect(JSON.parse(schema || '{}').offers.priceCurrency).toBe('IDR');
  expect((await (await request.get('/sitemap.xml')).text())).toContain('/produk/speaker-bluetooth-mini'); expect((await (await request.get('/robots.txt')).text())).toContain('Disallow: /admin');
});
test('wishlist tersimpan di DB dan bisa dihapus setelah refresh', async ({ page }) => {
  test.skip(!hasCredentials('customer'), 'Kredensial customer E2E belum tersedia.');
  await performLogin(page, 'customer'); await page.goto('/produk/speaker-bluetooth-mini');
  const hapus = page.getByRole('button', { name: 'Hapus Speaker Bluetooth Mini dari wishlist' });
  if (await hapus.count()) { await hapus.click(); await expect(page.getByRole('button', { name: 'Simpan Speaker Bluetooth Mini ke wishlist' })).toBeVisible(); }
  await page.getByRole('button', { name: 'Simpan Speaker Bluetooth Mini ke wishlist' }).click();
  await expect(page.getByRole('button', { name: 'Hapus Speaker Bluetooth Mini dari wishlist' })).toBeVisible(); await page.goto('/wishlist');
  await expect(page.getByRole('link', { name: 'Speaker Bluetooth Mini', exact: true })).toBeVisible(); await page.reload();
  await page.getByRole('button', { name: 'Hapus Speaker Bluetooth Mini dari wishlist' }).click();
  await expect(page.getByRole('link', { name: 'Speaker Bluetooth Mini', exact: true })).toHaveCount(0);
});
