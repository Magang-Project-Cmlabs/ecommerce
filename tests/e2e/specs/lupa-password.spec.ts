// Kartu kvnlhm · Hari 2 · Fitur lupa password (PRD §10.9, §13).
// Butuh database lokal berisi seed dan dev server tanpa SMTP_HOST (email
// dicetak ke konsol, OPEN_DECISIONS D6).
//
// Setiap tes memakai X-Real-IP unik supaya hitungan batas percobaan (5 / 15
// menit per IP) tidak saling mengganggu antar tes maupun antar run. Di
// production header ini ditulis ulang oleh Nginx, jadi tidak bisa dipalsukan.

import { test, expect, type Page } from '@playwright/test';
import { alasanLewati, hasCredentials } from '../helpers/auth';
import { tangkapError } from '../helpers/cek';
import { jumlahTokenReset, pasangTokenResetUji } from '../helpers/db';

const ipUnik = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
const emailUnik = (awalan: string) => `${awalan}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const pesan = (page: Page, peran: 'alert' | 'status', teks: string | RegExp) => page.getByRole(peran).filter({ hasText: teks });

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'x-real-ip': ipUnik() });
});

async function mintaReset(page: Page, email: string) {
  await page.goto('/lupa-password', { waitUntil: 'load' });
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Kirim link reset' }).click();
}

async function isiMasuk(page: Page, email: string, password: string) {
  await page.goto('/masuk', { waitUntil: 'load' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /^masuk$/i }).click();
}

async function daftarAkun(page: Page, email: string, password: string) {
  await page.goto('/daftar', { waitUntil: 'load' });
  await page.getByLabel('Nama lengkap').fill('Pembeli Reset');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Ulangi password').fill(password);
  await page.getByRole('checkbox', { name: /Syarat & Ketentuan/ }).check();
  await page.getByRole('button', { name: /^daftar$/i }).click();
}

test.describe('Lupa password', () => {
  test('tautan "Lupa password?" di halaman masuk', async ({ page }) => {
    await page.goto('/masuk', { waitUntil: 'load' });
    await page.getByRole('link', { name: 'Lupa password?' }).click();
    await page.waitForURL((u) => u.pathname === '/lupa-password');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lupa password');
  });

  test('email tidak sah ditolak di kolomnya', async ({ page }) => {
    await mintaReset(page, 'bukan-email');
    await expect(page.getByText('Format email tidak sah')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('respons sama untuk email terdaftar dan tidak terdaftar', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    const terdaftar = process.env.E2E_CUSTOMER_EMAIL!;
    const tidakTerdaftar = emailUnik('tidak-ada');

    const teksUntuk = async (email: string) => {
      await mintaReset(page, email);
      const status = pesan(page, 'status', 'kami sudah mengirim link');
      await expect(status).toBeVisible();
      return (await status.innerText()).replace(email, '<email>');
    };
    expect(await teksUntuk(terdaftar)).toBe(await teksUntuk(tidakTerdaftar));
  });

  test('alur penuh: minta link, buat password baru, masuk dengan password baru, link tidak bisa dipakai ulang', async ({
    page,
    context,
  }) => {
    const errors = tangkapError(page);
    const email = emailUnik('reset');
    await daftarAkun(page, email, 'passwordLama1');
    await page.waitForURL((u) => u.pathname === '/');
    await context.clearCookies();

    // Permintaan lewat UI benar-benar membuat token (diproses setelah respons).
    await mintaReset(page, email);
    await expect(pesan(page, 'status', 'kami sudah mengirim link')).toBeVisible();
    await expect.poll(() => jumlahTokenReset(email), { timeout: 10_000 }).toBe(1);

    // Token asli hanya ada di email; pasang token uji yang nilainya diketahui.
    const token = await pasangTokenResetUji(email);
    await page.goto(`/reset-password?token=${token}`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buat password baru');
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');

    await page.getByLabel('Password baru', { exact: true }).fill('passwordBaru1');
    await page.getByLabel('Ulangi password baru').fill('passwordBeda1');
    await page.getByRole('button', { name: 'Simpan password baru' }).click();
    await expect(page.getByText('Konfirmasi password tidak sama')).toBeVisible();

    await page.getByLabel('Password baru', { exact: true }).fill('passwordBaru1');
    await page.getByLabel('Ulangi password baru').fill('passwordBaru1');
    await page.getByRole('button', { name: 'Simpan password baru' }).click();
    await page.waitForURL((u) => u.pathname === '/masuk' && u.searchParams.get('reset') === 'berhasil');
    await expect(pesan(page, 'status', 'Password berhasil diganti')).toBeVisible();

    await isiMasuk(page, email, 'passwordLama1');
    await expect(pesan(page, 'alert', 'Email atau password salah')).toBeVisible();
    await isiMasuk(page, email, 'passwordBaru1');
    await page.waitForURL((u) => u.pathname === '/');

    await page.goto(`/reset-password?token=${token}`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Link tidak berlaku');
    expect(errors).toEqual([]);
  });

  test('link yang sudah dipakai di tab lain ditolak saat disimpan (sekali pakai di server)', async ({ page, context }) => {
    const email = emailUnik('dua-tab');
    await daftarAkun(page, email, 'passwordLama1');
    await page.waitForURL((u) => u.pathname === '/');
    await context.clearCookies();

    const token = await pasangTokenResetUji(email);
    const tabKedua = await context.newPage();
    for (const p of [page, tabKedua]) {
      await p.goto(`/reset-password?token=${token}`, { waitUntil: 'load' });
      await expect(p.getByRole('heading', { level: 1 })).toHaveText('Buat password baru');
    }

    await page.getByLabel('Password baru', { exact: true }).fill('passwordBaru1');
    await page.getByLabel('Ulangi password baru').fill('passwordBaru1');
    await page.getByRole('button', { name: 'Simpan password baru' }).click();
    await page.waitForURL((u) => u.pathname === '/masuk');

    await tabKedua.getByLabel('Password baru', { exact: true }).fill('passwordPenyerang1');
    await tabKedua.getByLabel('Ulangi password baru').fill('passwordPenyerang1');
    await tabKedua.getByRole('button', { name: 'Simpan password baru' }).click();
    await expect(pesan(tabKedua, 'alert', 'Link reset tidak berlaku lagi')).toBeVisible();

    await isiMasuk(page, email, 'passwordPenyerang1');
    await expect(pesan(page, 'alert', 'Email atau password salah')).toBeVisible();
  });

  test('link kedaluwarsa atau palsu tidak berlaku', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    const kedaluwarsa = await pasangTokenResetUji(process.env.E2E_CUSTOMER_EMAIL!, -1000);
    for (const token of [kedaluwarsa, 'palsu', 'a'.repeat(43)]) {
      await page.goto(`/reset-password?token=${token}`, { waitUntil: 'load' });
      await expect(page.getByRole('heading', { level: 1 }), `token ${token.slice(0, 8)}…`).toHaveText('Link tidak berlaku');
      await expect(page.getByRole('link', { name: 'Minta link baru' })).toBeVisible();
    }
  });
});

test.describe('Batas percobaan (5 / 15 menit per IP)', () => {
  test('lupa password: permintaan ke-6 ditolak', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await mintaReset(page, emailUnik('batas'));
      await expect(pesan(page, 'status', 'kami sudah mengirim link')).toBeVisible();
    }
    await mintaReset(page, emailUnik('batas'));
    await expect(pesan(page, 'alert', /Terlalu banyak percobaan\. Coba lagi dalam \d+ menit\./)).toBeVisible();
  });

  test('masuk: percobaan gagal ke-6 ditolak, bahkan dengan password benar', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    const email = process.env.E2E_CUSTOMER_EMAIL!;
    for (let i = 0; i < 5; i++) {
      await isiMasuk(page, email, `salah-${i}`);
      await expect(pesan(page, 'alert', 'Email atau password salah')).toBeVisible();
    }
    await isiMasuk(page, email, process.env.E2E_CUSTOMER_PASSWORD!);
    await expect(pesan(page, 'alert', /Terlalu banyak percobaan/)).toBeVisible();
    await expect(page).toHaveURL(/\/masuk/);
  });

  test('masuk: login berhasil mengosongkan hitungan', async ({ page, context }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    const email = process.env.E2E_CUSTOMER_EMAIL!;
    for (let i = 0; i < 4; i++) {
      await isiMasuk(page, email, `salah-${i}`);
      await expect(pesan(page, 'alert', 'Email atau password salah')).toBeVisible();
    }
    await isiMasuk(page, email, process.env.E2E_CUSTOMER_PASSWORD!);
    await page.waitForURL((u) => u.pathname === '/');
    await context.clearCookies();
    for (let i = 0; i < 5; i++) {
      await isiMasuk(page, email, `salah-lagi-${i}`);
      await expect(pesan(page, 'alert', 'Email atau password salah')).toBeVisible();
    }
  });

  test('daftar: percobaan ke-6 ditolak', async ({ page }) => {
    test.skip(!hasCredentials('customer'), alasanLewati('customer'));
    // Email yang sudah terdaftar: tidak membuat akun baru, tapi tetap dihitung.
    for (let i = 0; i < 5; i++) {
      await daftarAkun(page, process.env.E2E_CUSTOMER_EMAIL!, 'rahasia123');
      await expect(page.getByText('Email sudah terdaftar. Silakan masuk.')).toBeVisible();
    }
    await daftarAkun(page, process.env.E2E_CUSTOMER_EMAIL!, 'rahasia123');
    await expect(pesan(page, 'alert', /Terlalu banyak percobaan/)).toBeVisible();
  });
});
