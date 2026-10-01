import { test, expect, type Request } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import sharp from 'sharp';
import { hasCredentials, performLogin } from '../helpers/auth';

const exec = promisify(execFile);
const root = path.join(__dirname, '..', '..', '..');
async function db(command: string, marker: string) {
  const { stdout } = await exec(process.execPath, ['--import', 'tsx', path.join(root, 'tests/e2e/helpers/review-db-cli.ts'), command, process.env.E2E_CUSTOMER_EMAIL!, marker], { cwd: root });
  return JSON.parse(stdout);
}

test('tiga foto2MB diunggah terpisah dan ulasanfinal hanya membawa token', async ({ page }) => {
  test.skip(!hasCredentials('customer'), 'Kredensial pembeli uji belum tersedia.');
  const marker = `E2E foto ulasan ${Date.now()} — kualitas produk bagus dan sesuai.`;
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.headers()['next-action']) requests.push(request);
  });
  try {
    const item = await db('eligible', marker);
    expect(item, 'Database uji memerlukan item delivered tanpa ulasan dalam30hari.').not.toBeNull();
    await performLogin(page, 'customer');
    await page.goto(`/produk/${item.product.slug}#ulasan`);
    await expect(page.getByRole('heading', { name: 'Tulis Ulasan' })).toBeVisible();
    await page.getByLabel('Produk dari pesanan').selectOption(String(item.id));
    await page.getByLabel('Rating', { exact: true }).selectOption('5');
    await page.getByLabel('Ulasan Anda').fill(marker);
    const image = await sharp({ create: { width: 1000, height: 1000, channels: 3, background: '#f97316' } }).png().toBuffer();
    const buffer = Buffer.concat([image, Buffer.alloc(2 * 1024 * 1024 - image.length)]);
    await page.getByLabel('Foto produk (opsional)').setInputFiles([1, 2, 3].map((n) => ({ name: `foto-${n}.png`, mimeType: 'image/png', buffer })));
    requests.length = 0;
    await page.getByRole('button', { name: 'Kirim Ulasan', exact: true }).click();
    await expect(page.getByText('Ulasan berhasil dikirim. Terima kasih!', { exact: true })).toBeVisible({ timeout: 60000 });
    const review = await db('find', marker);
    // CDP omits binary files from postDataBuffer; Content-Length includes actual multipart bytes.
    const sizes = await Promise.all(requests.map(async (request) => Number(await request.headerValue('content-length')) || request.postDataBuffer()?.length || 0));
    console.log('Ukuran body request foto ulasan:', sizes);
    expect(review.orderItemId).toBe(item.id); expect(review.images).toHaveLength(3);
    expect(sizes).toHaveLength(4);
    expect(sizes.slice(0, 3).every((n) => n >= 2 * 1024 * 1024 && n < 3 * 1024 * 1024)).toBe(true);
    expect(sizes[3]).toBeLessThan(20000);
    expect(Math.max(...sizes)).toBeLessThan(4.5 * 1024 * 1024);
    await test.info().attach('ukuran-request-foto-ulasan', { body: JSON.stringify({ sizes, totalFileBytes: 3 * buffer.length, photos: review.images.length }), contentType: 'application/json' });
  } finally { await db('clean', marker); }
});
