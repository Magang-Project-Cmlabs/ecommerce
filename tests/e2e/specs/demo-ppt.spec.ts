// Latihan demo 7 menit sesuai PPT slide 19 / docs/DEMO.md, sekaligus rekaman
// cadangan: tiap langkah disimpan sebagai tangkapan layar di
// tests/e2e/.artifacts/demo/. Opt-in: E2E_DEMO=1 (menulis data; jalankan hanya
// pada database uji terisolasi).
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { performLogin } from '../helpers/auth';
import { mundurkanBatasBayarUji } from '../helpers/db';
import { loadEnv } from '../helpers/env';

loadEnv(path.join(__dirname, '..', '..', '..', '.env'));
const DIR = path.join(__dirname, '..', '.artifacts', 'demo');
let urutan = 0;
const foto = async (page: Page, nama: string) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: path.join(DIR, `${String(++urutan).padStart(2, '0')}-${nama}.png`) });
};

async function keKeranjangLaluCheckout(page: Page, promo?: string) {
  await page.goto('/produk/kaos-polos-premium');
  await page.getByRole('radio', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: 'Masukkan Keranjang' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  if (promo) {
    // HEMAT10 mensyaratkan belanja minimal Rp 100.000; dua kaos = Rp 178.000.
    await drawer.getByRole('button', { name: /^Tambah jumlah Kaos Polos Premium/ }).click();
    await expect(drawer.getByText('Rp 178.000').first()).toBeVisible();
    await drawer.getByLabel('Kode Promo').fill(promo);
    await drawer.getByRole('button', { name: 'Pakai' }).click();
    await expect(drawer.getByText(promo)).toBeVisible();
    await foto(page, 'keranjang-promo-hemat10');
  }
  await drawer.getByRole('link', { name: /Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
}

async function selesaikanCheckout(page: Page, simpan: boolean) {
  await expect(page.getByRole('button', { name: 'Lanjutkan', exact: true })).toBeEnabled();
  if (simpan) await foto(page, 'checkout-1-alamat');
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.getByRole('button', { name: /JNE Regular/ }).click();
  if (simpan) await foto(page, 'checkout-2-pengiriman');
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await page.getByRole('radio', { name: /Transfer Bank BCA/ }).check();
  if (simpan) await foto(page, 'checkout-3-pembayaran');
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Buat Pesanan', exact: true })).toBeEnabled();
  if (simpan) await foto(page, 'checkout-4-konfirmasi');
  await page.getByRole('button', { name: 'Buat Pesanan', exact: true }).click();
  await page.waitForURL(/\/checkout\/berhasil\/INV-/);
  return new URL(page.url()).pathname.split('/').pop()!;
}

test('latihan demo PPT: lima adegan dari pencarian sampai batal otomatis', async ({ page, browser }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1366, height: 800 });
  await page.setExtraHTTPHeaders({ 'x-real-ip': `10.222.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}` });
  const email = `demo-${Date.now()}@example.test`;

  // Persiapan: pembeli baru supaya HEMAT10 (batas 1 per pengguna) belum terpakai.
  await page.goto('/daftar');
  await page.getByLabel('Nama lengkap').fill('Pembeli Demo');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('DemoToko123');
  await page.getByLabel('Ulangi password').fill('DemoToko123');
  await page.getByRole('checkbox', { name: /Syarat & Ketentuan/ }).check();
  await page.getByRole('button', { name: /^daftar$/i }).click();
  await page.waitForURL((u) => u.pathname === '/');
  await foto(page, 'beranda');

  // Adegan 1: cari dan pilih varian.
  await page.getByRole('combobox', { name: /Cari produk/ }).fill('kao');
  await expect(page.getByRole('option').first()).toBeVisible();
  await foto(page, 'adegan1-saran-pencarian');
  await page.goto('/produk/kaos-polos-premium');
  await page.getByRole('radio', { name: 'M', exact: true }).click();
  await expect(page.getByText(/Tersedia \d+ barang/)).toBeVisible();
  await foto(page, 'adegan1-pilih-varian');

  // Adegan 2: checkout dengan HEMAT10.
  await keKeranjangLaluCheckout(page, 'HEMAT10');
  await page.getByRole('button', { name: 'Tambah Alamat Baru' }).click();
  await page.getByLabel('Nama Penerima').fill('Pembeli Demo');
  await page.getByLabel('Nomor Telepon').fill('081234567890');
  await page.getByLabel(/Alamat Lengkap/).fill('Jalan Kenanga nomor 12');
  await page.getByLabel('Kecamatan').fill('Tebet');
  await page.getByLabel(/Kode Pos/).fill('12820');
  await page.getByRole('button', { name: 'Simpan Alamat' }).click();
  const nomor = await selesaikanCheckout(page, true);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await foto(page, 'adegan2-pesanan-berhasil');

  // Adegan 3: admin konfirmasi pembayaran, kemas, kirim dengan resi.
  const adminContext = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  try {
    const admin = await adminContext.newPage();
    await performLogin(admin, 'admin');
    await admin.goto('/admin');
    await foto(admin, 'adegan3-dasbor-admin');
    await admin.goto(`/admin/pesanan?q=${nomor}`);
    await admin.getByRole('link', { name: nomor, exact: true }).click();
    await foto(admin, 'adegan3-detail-pesanan');
    for (const target of ['confirmed', 'packed', 'shipped']) {
      await admin.getByLabel('Tindakan').selectOption(target);
      if (target === 'shipped') await admin.getByLabel('Nomor resi').fill('JNE0123456789');
      await admin.getByRole('button', { name: 'Perbarui status' }).click();
      if (target === 'shipped') await expect(admin.getByText(/Pesanan diselesaikan oleh pembeli/)).toBeVisible();
      else await expect(admin.getByLabel('Tindakan')).toHaveValue(target === 'confirmed' ? 'packed' : 'shipped');
    }
    await foto(admin, 'adegan3-dikirim-dengan-resi');
  } finally { await adminContext.close(); }

  // Adegan 4: pembeli menerima dan memberi ulasan.
  await page.goto(`/akun/pesanan/${nomor}`);
  await expect(page.getByText('JNE0123456789', { exact: true })).toBeVisible();
  await foto(page, 'adegan4-lacak-pesanan');
  await page.getByRole('button', { name: 'Pesanan Diterima', exact: true }).click();
  await page.getByRole('button', { name: 'Ya, Pesanan Diterima', exact: true }).click();
  await page.getByRole('link', { name: 'Beri Ulasan' }).click();
  await page.getByLabel('Rating', { exact: true }).selectOption('5');
  const ulasan = `Kaosnya adem dan jahitannya rapi. ${nomor}`;
  await page.getByLabel('Ulasan Anda').fill(ulasan);
  await page.getByRole('button', { name: 'Kirim Ulasan' }).click();
  await expect(page.getByText(ulasan, { exact: true })).toBeVisible();
  await foto(page, 'adegan4-ulasan-terverifikasi');

  // Adegan 5: pesanan yang lewat batas bayar dibatalkan oleh job cron.
  await keKeranjangLaluCheckout(page);
  const nomorBatal = await selesaikanCheckout(page, false);
  await mundurkanBatasBayarUji(email, nomorBatal);
  const secret = process.env.CRON_SECRET;
  expect(secret, 'CRON_SECRET dari .env diperlukan untuk adegan 5').toBeTruthy();
  const cron = await page.request.get('/api/cron/orders', { headers: { Authorization: `Bearer ${secret}` } });
  expect(cron.ok()).toBe(true);
  expect((await cron.json()).cancelled).toBeGreaterThanOrEqual(1);
  await page.goto(`/akun/pesanan/${nomorBatal}`);
  await expect(page.getByText('Dibatalkan', { exact: true }).first()).toBeVisible();
  await foto(page, 'adegan5-batal-otomatis');
});
