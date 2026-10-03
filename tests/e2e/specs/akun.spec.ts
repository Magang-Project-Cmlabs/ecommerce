// Alur akun: daftar, keluar, masuk, dan penolakan (kartu kvnlhm · Hari 2).
// Butuh database lokal berisi seed (npm run db:reset) dan .env.e2e.

import { test, expect, type Page } from '@playwright/test';
import { hasCredentials, alasanLewati } from '../helpers/auth';
import { tangkapError } from '../helpers/cek';

const NAMA_COOKIE = 'tokokita_sesi';
const barAkun = (page: Page) => page.getByRole('navigation', { name: 'Akun' });

async function isiMasuk(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /^masuk$/i }).click();
}

test.describe('Akun', () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': `10.212.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}` });
  });
  test('tombol mata menampilkan dan menyembunyikan password di masuk dan daftar', async ({ page }) => {
    for (const path of ['/masuk', '/daftar']) {
      await page.goto(path, { waitUntil: 'load' });
      const kolom = page.getByLabel('Password', { exact: true });
      await kolom.fill('rahasia123');
      await expect(kolom).toHaveAttribute('type', 'password');
      const tombol = page.getByRole('button', { name: 'Tampilkan password' }).first();
      await tombol.click();
      await expect(kolom).toHaveAttribute('type', 'text');
      await expect(kolom).toHaveValue('rahasia123');
      await page.getByRole('button', { name: 'Sembunyikan password' }).click();
      await expect(kolom).toHaveAttribute('type', 'password');
    }
  });

  test('daftar akun baru, langsung masuk, lalu keluar', async ({ page, context }) => {
    const errors = tangkapError(page);
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto('/daftar', { waitUntil: 'load' });
    await page.getByLabel('Nama lengkap').fill('Pembeli E2E');
    await page.getByLabel('Email').fill(email.toUpperCase());
    await page.getByLabel('Password', { exact: true }).fill('rahasia123');
    await page.getByLabel('Ulangi password').fill('rahasia123');
    await page.getByRole('checkbox', { name: /Syarat & Ketentuan/ }).check();
    const registrationResponse = page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/daftar');
    await page.getByRole('button', { name: /^daftar$/i }).click();
    const sessionHeader = (await (await registrationResponse).headerValues('set-cookie')).find((header) => header.startsWith(`${NAMA_COOKIE}=`));
    expect(Boolean(sessionHeader), 'Response pendaftaran menetapkan cookie sesi.').toBe(true);
    // WebKit pada HTTP lokal dapat melaporkan sameSite=None di cookies();
    // periksa atribut wire yang dikirim server, tanpa menampilkan nilai JWT.
    const cookieAttributes = (sessionHeader ?? '').split(';').slice(1).map((attribute) => attribute.trim().toLowerCase());
    expect(cookieAttributes).toContain('samesite=lax');
    expect(cookieAttributes).toContain('httponly');

    await page.waitForURL((u) => u.pathname === '/');
    await expect(barAkun(page)).toContainText('Halo, Pembeli E2E');

    const cookie = (await context.cookies()).find((c) => c.name === NAMA_COOKIE);
    expect(cookie, 'cookie sesi terpasang').toBeTruthy();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.expires - Date.now() / 1000).toBeGreaterThan(29 * 24 * 3600);

    await barAkun(page).getByRole('button', { name: 'Keluar' }).click();
    // Keluar meminta konfirmasi; Batal tidak mengeluarkan, Ya, keluar mengeluarkan.
    const dialog = page.getByRole('alertdialog', { name: 'Keluar dari akun?' });
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(dialog).toBeHidden();
    await expect(barAkun(page)).toContainText('Halo, Pembeli E2E');
    await barAkun(page).getByRole('button', { name: 'Keluar' }).click();
    await dialog.getByRole('button', { name: 'Ya, keluar' }).click();
    await expect(barAkun(page).getByRole('link', { name: 'Masuk' })).toBeVisible();
    expect((await context.cookies()).find((c) => c.name === NAMA_COOKIE)).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test('daftar dengan isian salah menampilkan pesan per kolom dan tidak membuat sesi', async ({ page, context }) => {
    await page.goto('/daftar', { waitUntil: 'load' });
    await page.getByLabel('Nama lengkap').fill('B');
    await page.getByLabel('Email').fill('bukan-email');
    await page.getByLabel('Password', { exact: true }).fill('abc');
    await page.getByLabel('Ulangi password').fill('abd');
    await page.getByRole('button', { name: /^daftar$/i }).click();

    await expect(page.getByText('Nama minimal 2 karakter')).toBeVisible();
    await expect(page.getByText('Format email tidak sah')).toBeVisible();
    await expect(page.getByText('Password minimal 8 karakter')).toBeVisible();
    await expect(page.getByText('Konfirmasi password tidak sama')).toBeVisible();
    await expect(page.getByText(/Setujui Syarat & Ketentuan/)).toBeVisible();
    await expect(page.getByLabel('Nama lengkap')).toHaveValue('B');
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    expect((await context.cookies()).find((c) => c.name === NAMA_COOKIE)).toBeUndefined();
  });

  test('email yang sudah terdaftar ditolak dengan pesan jelas', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    await page.goto('/daftar', { waitUntil: 'load' });
    await page.getByLabel('Nama lengkap').fill('Orang Lain');
    await page.getByLabel('Email').fill(process.env.E2E_CUSTOMER_EMAIL!);
    await page.getByLabel('Password', { exact: true }).fill('rahasia123');
    await page.getByLabel('Ulangi password').fill('rahasia123');
    await page.getByRole('checkbox', { name: /Syarat & Ketentuan/ }).check();
    await page.getByRole('button', { name: /^daftar$/i }).click();
    await expect(page.getByText('Email sudah terdaftar. Silakan masuk.')).toBeVisible();
  });

  test('masuk dengan akun demo lalu kembali ke halaman asal (next)', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    await page.goto('/masuk?next=%2F%3Fdari%3Dmasuk', { waitUntil: 'load' });
    await isiMasuk(page, process.env.E2E_CUSTOMER_EMAIL!, process.env.E2E_CUSTOMER_PASSWORD!);
    await page.waitForURL((u) => u.pathname === '/' && u.searchParams.get('dari') === 'masuk');
    await expect(barAkun(page)).toContainText('Halo,');

    // Sudah masuk: membuka /masuk langsung dialihkan
    await page.goto('/masuk', { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/$/);
  });

  test('password salah dan email tidak terdaftar mendapat pesan yang sama persis', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    // Next.js juga memasang pengumum rute ber-role="alert"; ambil yang berisi teks.
    const pesan = () => page.getByRole('alert').filter({ hasText: /\S/ });

    await page.goto('/masuk', { waitUntil: 'load' });
    await isiMasuk(page, process.env.E2E_CUSTOMER_EMAIL!, 'password-salah');
    await expect(pesan()).toHaveText('Email atau password salah');

    await page.goto('/masuk', { waitUntil: 'load' });
    await isiMasuk(page, `tidak-ada-${Date.now()}@example.com`, 'password-salah');
    await expect(pesan()).toHaveText('Email atau password salah');
    await expect(page.getByLabel('Email')).not.toHaveValue('');
  });

  test('parameter next ke situs lain diabaikan (open redirect)', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    await page.goto('/masuk?next=https%3A%2F%2Fjahat.example%2F', { waitUntil: 'load' });
    await isiMasuk(page, process.env.E2E_CUSTOMER_EMAIL!, process.env.E2E_CUSTOMER_PASSWORD!);
    await page.waitForURL((u) => u.pathname === '/');
    expect(new URL(page.url()).host).not.toContain('jahat.example');
  });
});
