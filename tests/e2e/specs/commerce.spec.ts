import { test, expect, type Page } from '@playwright/test';
import { performLogin } from '../helpers/auth';
import { OPSI_TINDAKAN, pilihOpsi } from '../helpers/pilihan';

async function checkoutBaru(page: Page) {
  await page.setExtraHTTPHeaders({ 'x-real-ip': `10.221.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}` });
  await page.goto('/daftar');
  await page.getByLabel('Nama lengkap').fill('Pembeli Transaksi');
  await page.getByLabel('Email').fill(`commerce-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill('Transaksi123');
  await page.getByLabel('Ulangi password').fill('Transaksi123');
  await page.getByRole('checkbox', { name: /Syarat & Ketentuan/ }).check();
  await page.getByRole('button', { name: /^daftar$/i }).click();
  await page.waitForURL(u => u.pathname === '/');
  await page.goto('/produk/kaos-polos-premium');
  await page.getByRole('radio', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Masukkan Keranjang' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: /Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole('button', { name: 'Tambah Alamat Baru' }).click();
  await page.getByLabel('Nama Penerima').fill('Pembeli Transaksi');
  await page.getByLabel('Nomor Telepon').fill('081234567890');
  await page.getByLabel(/Alamat Lengkap/).fill('Jalan Pengujian nomor 12');
  await page.getByLabel('Kecamatan').fill('Tebet');
  await page.getByLabel(/Kode Pos/).fill('12820');
  await page.getByRole('button', { name: 'Simpan Alamat' }).click();
  await expect(page.getByRole('button', { name: 'Lanjutkan', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.getByRole('button', { name: /JNE Regular/ }).click();
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.getByRole('radio', { name: /Transfer Bank BCA/ }).check();
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Buat Pesanan', exact: true })).toBeEnabled();
  // Navigasi klien mempertahankan window: catat bila layar "keranjang kosong" sempat tampil.
  await page.evaluate(() => {
    const w = window as unknown as { keranjangKosongTampil?: boolean };
    new MutationObserver(() => { if (document.body.innerText.includes('Keranjang masih kosong')) w.keranjangKosongTampil = true; })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await page.getByRole('button', { name: 'Buat Pesanan', exact: true }).click();
  await page.waitForURL(/\/checkout\/berhasil\/INV-/);
  const number = new URL(page.url()).pathname.split('/').pop()!;
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { keranjangKosongTampil?: boolean }).keranjangKosongTampil ?? false)).toBe(false);
  await page.goto(`/akun/pesanan/${number}`);
  await expect(page.getByText('Transfer Bank BCA', { exact: true })).toBeVisible();
  return number;
}

test('belanja nyata: alamat → checkout → admin konfirmasi/kirim → pembeli terima → ulasan terverifikasi', async ({ page, browser }) => {
  test.setTimeout(150_000);
  const number = await checkoutBaru(page);
  const adminContext = await browser.newContext();
  try {
    const admin = await adminContext.newPage();
    await performLogin(admin, 'admin');
    await admin.goto(`/admin/pesanan?q=${number}`);
    await admin.getByRole('link', { name: number, exact: true }).click();
    for (const target of ['confirmed', 'packed', 'shipped']) {
      await pilihOpsi(admin, 'Tindakan', OPSI_TINDAKAN[target]!);
      if (target === 'shipped') await admin.getByLabel('Nomor resi').fill('JNE-E2E-123456');
      await admin.getByRole('button', { name: 'Perbarui status' }).click();
      if (target === 'shipped') await expect(admin.getByText(/Pesanan diselesaikan oleh pembeli/)).toBeVisible();
      else await expect(admin.getByLabel('Tindakan')).toHaveText(OPSI_TINDAKAN[target === 'confirmed' ? 'packed' : 'shipped']!);
    }
    await page.goto(`/akun/pesanan/${number}`);
    await expect(page.getByText('JNE-E2E-123456', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Pesanan Diterima', exact: true }).click();
    await page.getByRole('button', { name: 'Ya, Pesanan Diterima', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Beri Ulasan' })).toBeVisible();
    await page.getByRole('link', { name: 'Beri Ulasan' }).click();
    await expect(page.getByRole('heading', { name: 'Tulis Ulasan' })).toBeVisible();
    await pilihOpsi(page, 'Rating', '5 bintang');
    const review = `Barang diterima sesuai pesanan, kualitas bagus. ${number}`;
    await page.getByLabel('Ulasan Anda').fill(review);
    await page.getByRole('button', { name: 'Kirim Ulasan' }).click();
    await expect(page.getByText(review, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tulis Ulasan' })).toHaveCount(0);
    await page.screenshot({ path: 'tests/e2e/.artifacts/commerce-review.png', fullPage: true });
  } finally { await adminContext.close(); }
});

test('pembatalan pembeli tersimpan dan pesanan tidak bocor kepada akun lain', async ({ page, browser }) => {
  test.setTimeout(100_000);
  const number = await checkoutBaru(page);
  const other = await browser.newContext();
  try {
    const tab = await other.newPage(); await performLogin(tab, 'customer');
    await tab.goto(`/akun/pesanan/${number}`);
    await expect(tab.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
    await tab.goto(`/checkout/berhasil/${number}`);
    await expect(tab.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
    await expect(tab.getByText('Jalan Pengujian nomor 12', { exact: false })).toHaveCount(0);
  } finally { await other.close(); }
  await page.goto(`/akun/pesanan/${number}`);
  await page.getByRole('button', { name: 'Batalkan Pesanan', exact: true }).click();
  await page.getByLabel('Alasan Pembatalan').fill('Menguji pembatalan pesanan.');
  await page.getByRole('button', { name: 'Ya, Batalkan Pesanan', exact: true }).click();
  await expect(page.getByText('Dibatalkan', { exact: true }).first()).toBeVisible();
  await page.reload(); await expect(page.getByText('Dibatalkan', { exact: true }).first()).toBeVisible();
});
