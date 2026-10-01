// Unggah gambar produk lewat layar admin ke Vercel Blob SUNGGUHAN (opt-in: E2E_BLOB=1).
// Server uji harus berjalan dengan STORAGE_DRIVER=blob dan BLOB_READ_WRITE_TOKEN, mis.:
//   npx vercel env run -e production -- node <peluncur server uji>
// Berkas yang diunggah dihapus kembali dari store di akhir tes.
import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { performLogin } from '../helpers/auth';

test.skip(process.env.E2E_BLOB !== '1', 'Opt-in: E2E_BLOB=1 (menulis ke store Blob nyata)');

const POLA = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/uploads\/[0-9a-f-]{36}\.webp$/;
const urlAsli = (src: string) => { try { return new URL(src, 'http://x').searchParams.get('url') ?? src; } catch { return src; } };

test('admin mengunggah gambar produk: tersimpan di Blob, tampil, lalu dibersihkan', async ({ page }) => {
  test.setTimeout(120_000);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  expect(token, 'BLOB_READ_WRITE_TOKEN harus ada (jalankan lewat vercel env run)').toBeTruthy();
  const foto = await sharp({ create: { width: 900, height: 900, channels: 3, background: '#ea580c' } })
    .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><circle cx="450" cy="450" r="300" fill="#fff"/></svg>') }]).png().toBuffer();

  await performLogin(page, 'admin');
  await page.goto('/admin/produk');
  await page.getByRole('link', { name: 'Edit', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Edit produk' })).toBeVisible();
  const gambarBlob = async () => (await page.locator('main img').evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src))).map(urlAsli).filter((u) => POLA.test(u));
  const sebelum = await gambarBlob();

  await page.getByLabel('Unggah gambar', { exact: true }).setInputFiles({ name: 'uji-blob.png', mimeType: 'image/png', buffer: foto });
  await expect(page.getByText('uji-blob.png')).toBeVisible();
  await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Produk berhasil disimpan.' }).first()).toBeVisible({ timeout: 60_000 });

  await page.reload();
  await expect.poll(async () => (await gambarBlob()).length, { timeout: 20_000, message: 'gambar Blob baru harus tampil di halaman edit' }).toBe(sebelum.length + 1);
  const baru = (await gambarBlob()).filter((u) => !sebelum.includes(u));

  try {
    const respons = await page.request.get(baru[0]!);
    expect(respons.status()).toBe(200);
    expect(respons.headers()['content-type']).toContain('image/webp');
  } finally {
    const hapus = await fetch('https://vercel.com/api/blob/delete', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'x-api-version': '12', 'content-type': 'application/json' }, body: JSON.stringify({ urls: baru }) });
    expect(hapus.ok).toBe(true);
  }
});
