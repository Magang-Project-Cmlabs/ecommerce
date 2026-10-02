import { test, expect, type Browser } from '@playwright/test';
import sharp from 'sharp';
import { randomBytes } from 'node:crypto';
import { performLogin, hasCredentials, alasanLewati } from '../helpers/auth';
import { buatPesananAdminUji, bacaPesananAdminUji, hapusPesananAdminUji, hapusProdukAdminUji, hapusKontenAdminUji } from '../helpers/db';
import { OPSI_TINDAKAN, pilihOpsi } from '../helpers/pilihan';

const photo = async (width = 800, height = 800) => ({ name: 'produk.png', mimeType: 'image/png', buffer: await sharp({ create: { width, height, channels: 3, background: '#f97316' } }).png().toBuffer() });
async function loginAs(browser: Browser, _role: 'admin') {
  const context = await browser.newContext(); const page = await context.newPage();
  await performLogin(page, 'admin'); await expect(page.getByRole('navigation', { name: 'Akun admin', exact: true }).getByRole('button', { name: 'Keluar', exact: true })).toBeVisible();
  await page.close(); return context;
}
test.describe('Admin: toko memakai data nyata', () => {
  test.beforeEach(() => { test.skip(!hasCredentials('admin'), alasanLewati('admin')); });

  test('ringkasan dan semua menu terbuka, sidebar bekerja di 360 px', async ({ browser }, info) => {
    const context = await loginAs(browser, 'admin'); const page = await context.newPage();
    try {
      for (const [url, heading] of [['/admin', 'Ringkasan toko'], ['/admin/produk', 'Produk'], ['/admin/kategori', 'Kategori'], ['/admin/promo', 'Kode promo'], ['/admin/banner', 'Banner beranda'], ['/admin/pesanan', 'Pesanan']]) {
        await page.goto(url!); await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      }
      await page.goto('/admin'); await page.screenshot({ path: info.outputPath('admin-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 360, height: 780 });
      await expect(page.getByRole('button', { name: 'Menu admin' })).toBeVisible();
      await page.getByRole('button', { name: 'Menu admin' }).click();
      await page.getByRole('dialog').getByRole('link', { name: 'Produk', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Produk', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath('admin-mobile.png'), fullPage: true });
    } finally { await context.close(); }
  });

  test('tambah produk delapan gambar hampir 2MB per file, edit stok, lalu arsipkan', async ({ browser }) => {
    const context = await loginAs(browser, 'admin'); const page = await context.newPage(); const stamp = String(Date.now()); const slug = `admin-e2e-produk-${stamp}`;
    try {
      await page.addInitScript(() => {
        const measured = window as unknown as { imageRequests: { fileCount: number; bytes: Promise<number> }[] };
        measured.imageRequests = [];
        const original = window.fetch.bind(window);
        window.fetch = (input, init) => {
          if (init?.body instanceof FormData) {
            const fileCount = Array.from(init.body.values()).filter((value) => value instanceof Blob && value.size > 0).length;
            // Chrome DevTools strips file bytes from postDataBuffer. Measure the
            // actual browser multipart encoding instead of counting omitted data.
            const bytes = new Request('/multipart-size-check', { method: 'POST', body: init.body }).blob().then((body) => body.size);
            measured.imageRequests.push({ fileCount, bytes });
          }
          return original(input, init);
        };
      });
      await page.goto('/admin/produk'); await page.getByRole('link', { name: 'Tambah produk', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Tambah produk' })).toBeVisible();
      await page.getByLabel('Nama produk', { exact: true }).fill(`Kaos Admin ${stamp}`);
      await page.getByLabel(/Slug URL/).fill(slug); await page.getByLabel('Merek', { exact: true }).fill('TokoKita');
      await pilihOpsi(page, 'Kategori', 0);
      await page.getByLabel('Deskripsi', { exact: true }).fill('Produk uji admin dengan gambar dan varian.');
      await page.getByLabel('Harga jual (Rp)').fill('89000'); await page.getByLabel('Berat (gram)', { exact: true }).fill('200');
      await page.getByLabel(/Spesifikasi/).fill('Bahan: Katun\nWarna: Oranye'); await page.getByLabel(/Tag/).fill('katun, harian');
      await page.getByLabel(/Label varian/).fill('Ukuran'); await page.getByRole('button', { name: 'Tambah varian' }).click();
      const variant = page.getByRole('group', { name: 'Varian 1', exact: true }); await variant.getByLabel('Nama', { exact: true }).fill('M'); await variant.getByLabel('Stok', { exact: true }).fill('8');
      const large = await sharp(randomBytes(800 * 800 * 3), { raw: { width: 800, height: 800, channels: 3 } }).png({ compressionLevel: 0 }).toBuffer();
      expect(large.length).toBeGreaterThan(1_900_000); expect(large.length).toBeLessThan(2 * 1024 * 1024);
      await page.getByLabel('Unggah gambar', { exact: true }).setInputFiles(Array.from({ length: 8 }, (_, i) => ({ name: `gambar-${i}.png`, mimeType: 'image/png', buffer: large })));
      await page.getByRole('button', { name: 'Simpan produk', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 60000 });
      const requestSizes = await page.evaluate(async () => {
        const requests = (window as unknown as { imageRequests: { fileCount: number; bytes: Promise<number> }[] }).imageRequests;
        return Promise.all(requests.map(async (request) => ({ fileCount: request.fileCount, size: await request.bytes })));
      });
      expect(requestSizes.filter((request) => request.size > 1_500_000)).toHaveLength(8);
      expect(requestSizes.every((request) => request.size < 3 * 1024 * 1024 && request.fileCount <= 1)).toBe(true);
      await page.goto(`/admin/produk?q=${stamp}`); await page.getByRole('row').filter({ hasText: `Kaos Admin ${stamp}` }).getByRole('link', { name: 'Edit', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Edit produk' })).toBeVisible(); await expect(page.getByLabel('Nama produk', { exact: true })).toHaveValue(`Kaos Admin ${stamp}`);
      await page.getByLabel('Nama produk', { exact: true }).fill(`Kaos Admin Edit ${stamp}`);
      await page.getByRole('group', { name: 'Varian 1', exact: true }).getByLabel('Stok', { exact: true }).fill('12');
      await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click(); await expect(page.getByText('Produk berhasil disimpan.').first()).toBeVisible(); await expect(page.getByRole('dialog')).toBeHidden();
      await page.goto(`/admin/produk?q=${stamp}`); const row = page.getByRole('row').filter({ hasText: `Kaos Admin Edit ${stamp}` }); await expect(row).toContainText('12');
      await row.getByRole('button', { name: 'Arsipkan', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Lanjutkan' }).click();
      await expect(row).toContainText('Diarsipkan');
    } finally { await context.close(); await hapusProdukAdminUji(process.env.E2E_ADMIN_EMAIL!, slug); }
  });

  test('kategori, promo, dan banner dapat dibuat, diedit, dan dihapus', async ({ browser }) => {
    const context = await loginAs(browser, 'admin'); const page = await context.newPage(); const stamp = String(Date.now());
    try {
      await page.goto('/admin/kategori'); await page.getByRole('link', { name: 'Tambah kategori', exact: true }).click(); await page.getByLabel('Nama kategori', { exact: true }).fill(`Kategori Admin ${stamp}`); await page.getByLabel('Slug URL', { exact: true }).fill(`admin-e2e-kategori-${stamp}`); await page.getByRole('button', { name: 'Simpan kategori', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden();
      const category = page.getByRole('row').filter({ hasText: `Kategori Admin ${stamp}` }); await expect(category).toBeVisible(); await category.getByRole('link', { name: 'Edit', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Edit kategori' })).toBeVisible();
      await page.getByLabel('Nama kategori', { exact: true }).fill(`Kategori Admin Edit ${stamp}`); await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden();
      const editedCategory = page.getByRole('row').filter({ hasText: `Kategori Admin Edit ${stamp}` }); await editedCategory.getByRole('button', { name: 'Hapus', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Lanjutkan' }).click(); await expect(editedCategory).toHaveCount(0);
      await page.goto('/admin/promo'); const code = `E2E${stamp}`; await page.getByRole('link', { name: 'Tambah promo', exact: true }).click(); await page.getByLabel('Kode promo', { exact: true }).fill(code); await page.getByLabel('Deskripsi', { exact: true }).fill('Promo uji admin'); await page.getByLabel(/Nilai diskon/).fill('10'); await page.getByLabel('Mulai (WIB)').fill('2026-10-01T00:00'); await page.getByLabel('Berakhir (WIB)').fill('2027-10-01T00:00'); await page.getByRole('button', { name: 'Simpan promo', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden();
      const promo = page.getByRole('row').filter({ hasText: code }); await expect(promo).toContainText('10%'); await promo.getByRole('link', { name: 'Edit', exact: true }).click(); await expect(page.getByLabel('Kode promo', { exact: true })).toHaveAttribute('readonly', ''); await page.getByLabel(/Nilai diskon/).fill('15'); await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden(); await expect(promo).toContainText('15%'); await promo.getByRole('button', { name: 'Hapus', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Lanjutkan' }).click(); await expect(promo).toHaveCount(0);
      await page.goto('/admin/banner'); await page.getByRole('link', { name: 'Tambah banner', exact: true }).click(); await page.getByLabel('Judul banner', { exact: true }).fill(`Banner Admin ${stamp}`); await page.getByLabel('Teks tombol').fill('Belanja sekarang'); await page.getByLabel('Tautan halaman toko').fill('/produk'); await page.getByLabel(/Gambar banner/).setInputFiles(await photo(1200, 400)); await page.getByRole('button', { name: 'Simpan banner', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30000 });
      const banner = page.getByRole('listitem').filter({ has: page.getByText(`Banner Admin ${stamp}`, { exact: true }) }); await expect(banner).toBeVisible(); await banner.getByRole('link', { name: 'Edit banner', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Edit banner' })).toBeVisible(); await page.getByLabel('Urutan tampilan', { exact: true }).fill('5'); await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden(); await expect(banner).toContainText('Urutan 5'); await banner.getByRole('button', { name: 'Hapus', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Lanjutkan' }).click(); await expect(banner).toHaveCount(0);
    } finally { await context.close(); await hapusKontenAdminUji(process.env.E2E_ADMIN_EMAIL!, stamp); }
  });

  test('konfirmasi bayar, kemas, kirim dengan resi; batal mengembalikan stok satu kali', async ({ browser }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    const email = process.env.E2E_CUSTOMER_EMAIL!; const first = await buatPesananAdminUji(email); const second = await buatPesananAdminUji(email);
    const context = await loginAs(browser, 'admin'); const page = await context.newPage();
    try {
      await page.goto(`/admin/pesanan/${first.orderId}`); await expect(page.getByRole('heading', { name: first.orderNumber })).toBeVisible(); await page.getByRole('button', { name: 'Perbarui status' }).click(); await expect(page.getByText('Dikonfirmasi', { exact: true }).first()).toBeVisible();
      await page.getByRole('button', { name: 'Perbarui status' }).click(); await expect(page.getByText('Dikemas', { exact: true }).first()).toBeVisible();
      await page.getByLabel('Nomor resi', { exact: true }).fill('ADMIN-RESI-123'); await page.getByRole('button', { name: 'Perbarui status' }).click(); await expect(page.getByText('Dikirim', { exact: true }).first()).toBeVisible();
      expect(await bacaPesananAdminUji(email, first.orderId)).toMatchObject({ status: 'shipped', paymentStatus: 'paid', trackingNumber: 'ADMIN-RESI-123', logs: 4, stock: 2 });
      await page.goto(`/admin/pesanan/${second.orderId}`); await pilihOpsi(page, 'Tindakan', OPSI_TINDAKAN.cancelled!); await page.getByLabel('Alasan pembatalan', { exact: true }).fill('Permintaan pembeli untuk pengujian'); await page.getByRole('button', { name: 'Perbarui status' }).click(); await expect(page.getByText('Dibatalkan', { exact: true }).first()).toBeVisible();
      expect(await bacaPesananAdminUji(email, second.orderId)).toMatchObject({ status: 'cancelled', logs: 2, stock: 3 }); await page.reload(); expect((await bacaPesananAdminUji(email, second.orderId)).stock).toBe(3);
    } finally { await context.close(); await hapusPesananAdminUji(email, first); await hapusPesananAdminUji(email, second); }
  });
});
