// Opt-in saja: uang simulasi pada domain sandbox resmi, fixture DB terisolasi.
// Tidak membuktikan pengiriman webhook dari internet ke domain production.
import { createHash } from 'node:crypto';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { performLogin, hasCredentials } from '../helpers/auth';
import { loadEnv } from '../helpers/env';
import { buatPesananSandboxUji, bacaPesananAdminUji, hapusPesananAdminUji, type MetodeSandbox } from '../helpers/db';

loadEnv();
// loadEnv tidak menimpa DATABASE_URL uji dari .env.e2e/proses runner.
loadEnv(path.join(__dirname, '..', '..', '..', '.env'));

type StatusSandbox = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  transaction_status?: string;
};

async function bayarSimulator(page: Page, method: MetodeSandbox, total: number) {
  expect(new URL(page.url()).hostname).toBe('app.sandbox.midtrans.com');
  if (method === 'bank_bca') {
    await expect(page.locator('body')).toContainText(/Virtual account number\s*\d{10,30}/i, { timeout: 30_000 });
    const va = /Virtual account number\s*(\d{10,30})/i.exec(await page.locator('body').innerText())?.[1];
    expect(Boolean(va), 'Snap BCA harus menyediakan nomor virtual account.').toBe(true);
    await page.goto('https://simulator.sandbox.midtrans.com/bca/va/index', { waitUntil: 'load' });
    expect(new URL(page.url()).hostname).toBe('simulator.sandbox.midtrans.com');
    await page.locator('input[name="va_number"]').fill(va!);
    await page.locator('input[type="submit"]').click();
    await expect(page.locator('input[name="total_amount"]')).toBeVisible();
    await page.locator('input[name="total_amount"]').fill(String(total));
    await page.locator('input[value="Pay"]').click({ timeout: 10_000 });
    return;
  }
  if (method === 'bank_mandiri') {
    await expect(page.locator('body')).toContainText(/Company code|Biller code/i, { timeout: 30_000 });
    const text = await page.locator('body').innerText();
    const biller = /(?:Company code|Biller code)\s*(\d{3,10})/i.exec(text)?.[1];
    const billKey = /(?:Bill key|Bill number|Virtual account number)\s*(\d{5,30})/i.exec(text)?.[1];
    expect(Boolean(biller && billKey), 'Snap Mandiri harus menyediakan biller code dan bill key.').toBe(true);
    await page.goto('https://simulator.sandbox.midtrans.com/openapi/va/index?bank=mandiri', { waitUntil: 'load' });
    expect(new URL(page.url()).hostname).toBe('simulator.sandbox.midtrans.com');
    await page.locator('input[name="billerCode"]').fill(biller!);
    await page.locator('input[name="billKey"]').fill(billKey!);
    // Blur menjalankan onchange resmi yang mengisi hidden vaNumber.
    await page.locator('input[value="Inquire"]').click();
    const amount = page.locator('input[name="totalAmount"], input[name="amount"], input[name="total_amount"]').first();
    if (await amount.isVisible() && await amount.isEditable()) await amount.fill(String(total));
    await page.getByRole('button', { name: /^pay$|^confirm payment$|^bayar$/i }).click({ timeout: 10_000 });
    return;
  }
  // Desktop Snap: pilih QRIS dari daftar, lalu gunakan src gambar langsung.
  const qrImage = page.getByRole('img', { name: 'qr-code', exact: true });
  const readQrUrl = async () => qrImage.evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src).find((src) => {
    const url = new URL(src);
    return url.protocol === 'https:' && ['api.sandbox.midtrans.com', 'merchants-app.sbx.midtrans.com'].includes(url.hostname) && /qr-code|qrcode|qris/.test(url.pathname);
  }));
  if (!await readQrUrl()) {
    const choice = page.getByText('QRIS', { exact: true }).first();
    if (await choice.isVisible()) await choice.click();
    else await page.getByText(/GoPay/i).first().click();
  }
  let qrUrl: string | undefined;
  await expect.poll(async () => { qrUrl = await readQrUrl(); return Boolean(qrUrl); }, { timeout: 30_000 }).toBe(true);
  expect(['api.sandbox.midtrans.com', 'merchants-app.sbx.midtrans.com'].includes(new URL(qrUrl!).hostname)).toBe(true);
  await page.goto('https://simulator.sandbox.midtrans.com/v2/qris/index', { waitUntil: 'load' });
  expect(new URL(page.url()).hostname).toBe('simulator.sandbox.midtrans.com');
  await page.locator('input[name="qrCodeUrl"]').fill(qrUrl!);
  await page.locator('input[value="Scan QR"]').click();
  const providerError = /Failed to process QR[^\n]*|QR inputted unparsable[^\n]*/i.exec(await page.locator('body').innerText())?.[0];
  if (providerError) throw new Error(`Simulator resmi Midtrans menolak QR sandbox: ${providerError}`);
  // Provider selection is a simulator field, not a wallet/account login.
  const provider = page.locator('select:not(.page-option)').first();
  if (await provider.isVisible()) {
    const goPay = await provider.locator('option').evaluateAll((options) => options.map((option) => ({ text: option.textContent ?? '', value: (option as HTMLOptionElement).value })).find((option) => /gopay/i.test(option.text + option.value))?.value);
    if (goPay) await provider.selectOption(goPay);
  }
  await page.getByRole('button', { name: /^pay$|^confirm payment$|^bayar$/i }).click({ timeout: 10_000 });
}

for (const [label, method] of [['BCA', 'bank_bca'], ['Mandiri', 'bank_mandiri'], ['QRIS', 'qris']] as const) {
test(`${label} sandbox: Snap, simulator resmi, cek pembayaran dan webhook idempoten`, async ({ page }, info) => {
  test.setTimeout(240_000);
  // Jika berkas dipanggil langsung tanpa opt-in, gagal aman, bukan skip diam-diam.
  expect(process.env.E2E_MIDTRANS_SANDBOX, 'Aktifkan E2E_MIDTRANS_SANDBOX=1 secara eksplisit.').toBe('1');
  expect(hasCredentials('customer'), 'Kredensial customer uji wajib diisi.').toBe(true);
  const dbName = new URL(process.env.DATABASE_URL ?? '').pathname;
  expect(dbName.includes('verifikasi') || dbName.endsWith('_test'), 'Sandbox hanya boleh memakai DB uji terisolasi.').toBe(true);
  expect(process.env.MIDTRANS_IS_PRODUCTION === 'true', 'Mode Midtrans wajib sandbox.').toBe(false);
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
  // Assertion boolean menjaga server key tetap tidak tercetak ketika gagal.
  expect(serverKey.startsWith('SB-Mid-server-'), 'Kunci sandbox Midtrans wajib tersedia.').toBe(true);
  const baseUrl = new URL(String(info.project.use.baseURL));
  expect(['localhost', '127.0.0.1'].includes(baseUrl.hostname), 'Tes mutasi ini hanya menuju aplikasi lokal.').toBe(true);

  const email = process.env.E2E_CUSTOMER_EMAIL!;
  const fixture = await buatPesananSandboxUji(email, method);
  const orderPath = `/akun/pesanan/${fixture.orderNumber}`;
  try {
    expect(await bacaPesananAdminUji(email, fixture.orderId)).toMatchObject({ status: 'pending', paymentStatus: 'unpaid', grandTotal: 114000, logs: 1, stock: 2 });
    await performLogin(page, 'customer');
    await page.goto(orderPath, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: fixture.orderNumber, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Bayar Sekarang', exact: true }).click();
    await page.waitForURL((url) => url.hostname === 'app.sandbox.midtrans.com', { timeout: 45_000, waitUntil: 'load' });
    // Verifikasi domain sebelum membaca nomor VA atau mengoperasikan simulator.
    expect(new URL(page.url()).hostname).toBe('app.sandbox.midtrans.com');
    const pending = await bacaPesananAdminUji(email, fixture.orderId);
    expect(pending.paymentTransactionId).toBe(fixture.orderNumber);
    await bayarSimulator(page, method, pending.grandTotal);

    let paid: StatusSandbox = {};
    await expect.poll(async () => {
      // Node fetch menjaga Authorization keluar dari trace browser dan log tes.
      const response = await fetch(`https://api.sandbox.midtrans.com/v2/${encodeURIComponent(pending.paymentTransactionId!)}/status`, {
        headers: { Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return `http-${response.status}`;
      paid = await response.json() as StatusSandbox;
      return paid.transaction_status;
    }, { timeout: 60_000, intervals: [1000, 2000, 5000] }).toBe('settlement');
    expect(paid.order_id).toBe(fixture.orderNumber);
    expect(Number(paid.gross_amount)).toBe(114000);

    // Status DB tidak ditulis oleh tes: tombol memeriksa API Midtrans sungguhan.
    await page.goto(orderPath, { waitUntil: 'load' });
    await page.getByRole('button', { name: 'Cek Pembayaran', exact: true }).click();
    await expect.poll(async () => {
      const state = await bacaPesananAdminUji(email, fixture.orderId);
      return { status: state.status, paymentStatus: state.paymentStatus, logs: state.logs, stock: state.stock };
    }).toEqual({ status: 'confirmed', paymentStatus: 'paid', logs: 2, stock: 2 });
    await expect(page.getByText('Dikonfirmasi', { exact: true }).first()).toBeVisible();

    const notification = {
      order_id: paid.order_id!, status_code: paid.status_code!, gross_amount: paid.gross_amount!,
      transaction_status: paid.transaction_status!,
      signature_key: createHash('sha512').update(paid.order_id! + paid.status_code! + paid.gross_amount! + serverKey).digest('hex'),
    };
    const webhookUrl = new URL('/api/payment/midtrans', baseUrl);
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notification), signal: AbortSignal.timeout(30_000) });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ hasil: 'sudah-diproses' });
    }
    const rejected = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...notification, signature_key: 'ab'.repeat(64) }), signal: AbortSignal.timeout(30_000) });
    expect(rejected.status).toBe(401);
    expect(await rejected.json()).toEqual({ hasil: 'signature-salah' });
    expect(await bacaPesananAdminUji(email, fixture.orderId)).toMatchObject({ status: 'confirmed', paymentStatus: 'paid', paymentTransactionId: fixture.orderNumber, grandTotal: 114000, logs: 2, stock: 2 });
    await info.attach('sandbox-result', { body: JSON.stringify({ method, orderNumber: fixture.orderNumber, amount: 114000, transactionStatus: paid.transaction_status, paymentStatus: 'paid', statusLogs: 2, repeatedWebhook: 'sudah-diproses', invalidSignatureHttp: 401 }), contentType: 'application/json' });
  } finally {
    // Hapus hanya order/product fixture yang ditandai admin-e2e- milik akun uji.
    await hapusPesananAdminUji(email, fixture);
  }
});
}
