// Asisten belanja (D23): rekomendasi produk berupa kartu dari database, tambah ke keranjang,
// tombol checkout, draf alamat yang mengisi formulir checkout (nomor HP tidak dikirim ke AI),
// dan pilihan kurir. Memakai model AI sungguhan, jadi butuh ASISTEN_API_KEY di server uji;
// tanpa itu tes dilewati dengan alasan jelas. Tes tidak menyimpan alamat (tidak menulis data).

import { test, expect, type Locator, type Page } from '@playwright/test';
import { alasanLewati, hasCredentials, performLogin } from '../helpers/auth';

const TIDAK_AKTIF = /belum aktif|sedang ramai|belum bisa menjawab|dinonaktifkan|batas/;
const BATAS_TUNGGU = 60_000;

async function bukaPanel(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: /^Tanya AI/ }).click();
  const panel = page.getByRole('dialog', { name: 'Asisten TokoKita' });
  await expect(panel).toBeVisible();
  return panel;
}

/** Kirim pertanyaan dan tunggu jawaban baru (atau pesan bahwa AI belum aktif → tes dilewati). */
async function tanya(panel: Locator, pertanyaan: string): Promise<void> {
  const log = panel.getByRole('log');
  const sebelum = await log.locator('> div').count();
  await panel.getByLabel('Pertanyaan untuk asisten').fill(pertanyaan);
  await panel.getByRole('button', { name: 'Kirim pertanyaan' }).click();
  await expect(log).toHaveAttribute('aria-busy', 'false', { timeout: BATAS_TUNGGU });
  const galat = panel.getByRole('alert');
  if (await galat.count()) {
    const teks = (await galat.innerText()).trim();
    test.skip(TIDAK_AKTIF.test(teks), `Asisten AI tidak menjawab di lingkungan uji: ${teks}`);
    throw new Error(`Asisten gagal menjawab: ${teks}`);
  }
  await expect.poll(() => log.locator('> div').count()).toBeGreaterThan(sebelum);
}

test.describe.configure({ mode: 'serial' });

test('rekomendasi produk tampil sebagai kartu dari database dan bisa ditambah ke keranjang', async ({ page }) => {
  await page.goto('/');
  const panel = await bukaPanel(page);
  await tanya(panel, 'Saya cari sepatu untuk lari, budget di bawah 500 ribu. Ada rekomendasi?');

  const kartu = panel.getByRole('article').first();
  await expect(kartu).toBeVisible();
  await expect(kartu).toContainText(/Rp\s?\d/);
  // Penanda mentah tidak pernah tampil ke pembeli.
  await expect(panel.getByRole('log')).not.toContainText('[[');

  const varianTersedia = kartu.locator('fieldset button:not([disabled])');
  if (await varianTersedia.count()) await varianTersedia.first().click();
  await kartu.getByRole('button', { name: /Tambah/ }).click();
  await expect(kartu.getByRole('status')).toHaveText(/Ada di keranjang/);
  await expect(page.getByText('Ditambahkan ke keranjang')).toBeVisible();

  const keranjang = await page.evaluate(() => JSON.parse(localStorage.getItem('tokokita-cart') ?? '{}'));
  expect(keranjang.state.items).toHaveLength(1);
  expect(keranjang.state.items[0].price).toBeGreaterThan(0);
});

test('asisten membantu checkout: keranjang, tombol checkout, isi alamat tanpa mengirim nomor HP, pilih kurir', async ({ page }) => {
  test.skip(!hasCredentials('customer'), alasanLewati('customer'));
  test.setTimeout(240_000);
  await performLogin(page, 'customer');
  await page.goto('/');
  await page.evaluate(() => { localStorage.removeItem('tokokita-cart'); sessionStorage.clear(); });
  await page.reload();

  // Catat semua body permintaan Server Action untuk memastikan nomor HP tidak pernah dikirim.
  const bodyTerkirim: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST') bodyTerkirim.push(r.postData() ?? ''); });

  let panel = await bukaPanel(page);
  await tanya(panel, 'Masukkan Kaos Polos Premium ukuran M sebanyak 1 ke keranjang ya');
  const kaos = panel.getByRole('article', { name: 'Kaos Polos Premium' });
  await expect(kaos).toBeVisible();
  const ukuranM = kaos.getByRole('button', { name: 'M', exact: true });
  if ((await ukuranM.getAttribute('aria-pressed')) !== 'true') await ukuranM.click();
  await kaos.getByRole('button', { name: /Tambah/ }).click();
  await expect(kaos.getByRole('status')).toHaveText(/Ada di keranjang/);

  await tanya(panel, 'Oke, saya mau checkout sekarang');
  await panel.getByRole('button', { name: /Lanjut ke Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: 'Checkout', level: 1 })).toBeVisible();

  // Di checkout tombol asisten tetap ada; riwayat percakapan tetap tersimpan.
  panel = page.getByRole('dialog', { name: 'Asisten TokoKita' });
  if (!(await panel.isVisible())) panel = await bukaPanel(page);
  await tanya(panel, 'Tolong isi alamat pengiriman: Budi Santoso, HP 0812-3456-7890, Jl. Melati No. 5 RT 01/RW 02, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132');
  const draf = panel.getByText('Draf alamat pengiriman').locator('..');
  await expect(draf).toBeVisible();
  await expect(draf).toContainText('Budi Santoso');
  await expect(draf).toContainText('081234567890');
  expect(bodyTerkirim.join('\n')).not.toMatch(/3456-?7890/);
  expect(bodyTerkirim.join('\n')).toContain('NOMOR_HP_1');

  await draf.getByRole('button', { name: 'Isi Formulir Alamat' }).click();
  await expect(page.getByLabel('Nama Penerima *')).toHaveValue('Budi Santoso');
  await expect(page.getByLabel('Nomor Telepon *')).toHaveValue('081234567890');
  await expect(page.getByLabel(/Kode Pos/)).toHaveValue('40132');
  await expect(page.getByLabel('Kecamatan *')).toHaveValue('Coblong');
  await expect(page.getByText('Diisi dari Asisten TokoKita')).toBeVisible();

  await tanya(panel, 'Saya pilih kurir JNE saja');
  const kurir = panel.getByText('JNE Regular', { exact: true }).locator('../..');
  await expect(kurir).toBeVisible();
  await kurir.getByRole('button', { name: 'Pakai' }).click();
  await expect(page.getByText(/Kurir JNE Regular dipilih|Pilih atau tambah alamat pengiriman dulu/)).toBeVisible();
});
