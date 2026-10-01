import { test, expect, type Request } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { hasCredentials, performLogin } from '../helpers/auth';

const exec = promisify(execFile);
const root = path.join(__dirname, '..', '..', '..');
async function db(command: string, marker: string, uploadUrls: string[] = []) {
  const { stdout } = await exec(process.execPath, ['--import', 'tsx', path.join(root, 'tests/e2e/helpers/review-db-cli.ts'), command, process.env.E2E_CUSTOMER_EMAIL!, marker, JSON.stringify(uploadUrls)], { cwd: root });
  return JSON.parse(stdout);
}

type MultipartMeasurement = { size: number; fileCount: number; fileSizes: number[]; tokenCount: number; uploadedUrls: string[] };

test('tiga foto2MB diunggah terpisah dan ulasanfinal hanya membawa token', async ({ page }) => {
  test.skip(!hasCredentials('customer'), 'Kredensial pembeli uji belum tersedia.');
  const marker = `E2E foto ulasan ${Date.now()}-${randomUUID()} — kualitas produk bagus dan sesuai.`;
  await page.addInitScript(() => {
    const measured = window as unknown as { reviewMultipart: Promise<MultipartMeasurement>[] };
    measured.reviewMultipart = [];
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const response = original(input, init);
      if (init?.body instanceof FormData && new Headers(init.headers).has('next-action')) {
        const body = init.body;
        const files = Array.from(body.values()).filter((value): value is File => value instanceof Blob && value.size > 0);
        const tokenValue = Array.from(body.entries()).find(([name]) => name.endsWith('uploadTokens'))?.[1];
        const tokens: unknown = typeof tokenValue === 'string' ? JSON.parse(tokenValue) : [];
        // Request.blob serializes actual browser multipart including binary;
        // Playwright/WebKit request metadata can omit file bytes/Content-Length.
        const encodedSize = new Request(location.href, { method: 'POST', body }).blob().then((encoded) => encoded.size);
        const urls = files.length ? response.then((r) => r.clone().text()).then((text) => Array.from(new Set(text.match(/\/uploads\/[0-9a-f-]{36}\.webp/g) ?? []))) : Promise.resolve([]);
        measured.reviewMultipart.push(Promise.all([encodedSize, urls]).then(([size, uploadedUrls]) => ({ size, fileCount: files.length, fileSizes: files.map((file) => file.size), tokenCount: Array.isArray(tokens) ? tokens.length : 0, uploadedUrls })));
      }
      return response;
    };
  });
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.headers()['next-action']) requests.push(request);
  });
  try {
    const item = await db('fixture', marker);
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
    await page.evaluate(() => { (window as unknown as { reviewMultipart: Promise<MultipartMeasurement>[] }).reviewMultipart = []; });
    await page.getByRole('button', { name: 'Kirim Ulasan', exact: true }).click();
    await expect(page.getByText('Ulasan berhasil dikirim. Terima kasih!', { exact: true })).toBeVisible({ timeout: 60000 });
    const review = await db('find', marker);
    const multipart = await page.evaluate(async () => Promise.all((window as unknown as { reviewMultipart: Promise<MultipartMeasurement>[] }).reviewMultipart));
    const sizes = multipart.map((request) => request.size);
    const reportedContentLengths = await Promise.all(requests.map((request) => request.headerValue('content-length')));
    console.log('Ukuran body request foto ulasan:', sizes);
    expect(review.orderItemId).toBe(item.id); expect(review.images).toHaveLength(3);
    expect(sizes).toHaveLength(4);
    expect(requests).toHaveLength(4);
    expect(multipart.slice(0, 3).map(({ fileCount, fileSizes, tokenCount }) => ({ fileCount, fileSizes, tokenCount }))).toEqual([1, 2, 3].map(() => ({ fileCount: 1, fileSizes: [2 * 1024 * 1024], tokenCount: 0 })));
    expect(multipart[3]).toMatchObject({ fileCount: 0, fileSizes: [], tokenCount: 3 });
    expect(sizes.slice(0, 3).every((n) => n >= 2 * 1024 * 1024 && n < 3 * 1024 * 1024)).toBe(true);
    expect(sizes[3]).toBeLessThan(20000);
    expect(Math.max(...sizes)).toBeLessThan(4.5 * 1024 * 1024);
    await test.info().attach('ukuran-request-foto-ulasan', { body: JSON.stringify({ method: 'browser Request multipart encoding; network POST count verified', sizes, reportedContentLengths, fileCounts: multipart.map((request) => request.fileCount), finalTokenCount: multipart[3]!.tokenCount, totalFileBytes: 3 * buffer.length, photos: review.images.length }), contentType: 'application/json' });
  } finally {
    const uploadedUrls = await page.evaluate(async () => {
      const measured = (window as unknown as { reviewMultipart?: Promise<MultipartMeasurement>[] }).reviewMultipart ?? [];
      return (await Promise.allSettled(measured)).flatMap((result) => result.status === 'fulfilled' ? result.value.uploadedUrls : []);
    }).catch(() => []);
    await db('clean', marker, uploadedUrls);
  }
});
