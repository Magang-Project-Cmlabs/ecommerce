// Penyedia sesi login untuk tes.
//
// Sesi SELALU didapat dengan login sungguhan lewat form /masuk, lalu disimpan
// sebagai storageState di tests/e2e/.auth/ (diabaikan Git). Jangan pernah
// membuat cookie JWT sendiri untuk melewati login: tes seperti itu tidak
// membuktikan apa pun tentang alur login yang dipakai pembeli.
//
// Kredensial dibaca dari .env.e2e. Tanpa kredensial, tes yang butuh login
// dilewati dengan alasan yang jelas.

import fs from 'node:fs';
import path from 'node:path';
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export type Peran = 'customer' | 'admin';

const AUTH_DIR = path.join(__dirname, '..', '.auth');

const PERAN: Record<Peran, { userEnv: string; passEnv: string; halamanDalam: string }> = {
  customer: { userEnv: 'E2E_CUSTOMER_EMAIL', passEnv: 'E2E_CUSTOMER_PASSWORD', halamanDalam: '/akun' },
  admin: { userEnv: 'E2E_ADMIN_EMAIL', passEnv: 'E2E_ADMIN_PASSWORD', halamanDalam: '/admin' },
};

export const POLA_MASUK = /\/masuk(\?|$)/;

function statePath(peran: Peran) {
  return path.join(AUTH_DIR, `${peran}.json`);
}

export function hasCredentials(peran: Peran): boolean {
  const cfg = PERAN[peran];
  return !!(process.env[cfg.userEnv] && process.env[cfg.passEnv]);
}

export function alasanLewati(peran: Peran): string {
  const cfg = PERAN[peran];
  return `Isi ${cfg.userEnv} dan ${cfg.passEnv} di tests/e2e/.env.e2e untuk menjalankan tes peran ${peran}.`;
}

// Login lewat form. Bergantung pada label yang terlihat pengguna (juga syarat
// aksesibilitas), bukan pada nama kelas CSS.
export async function performLogin(page: Page, peran: Peran): Promise<void> {
  const cfg = PERAN[peran];
  await page.setExtraHTTPHeaders({ 'x-real-ip': `10.211.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}` });
  await page.goto('/masuk', { waitUntil: 'load' });
  await page.getByLabel(/email/i).fill(process.env[cfg.userEnv]!);
  await page.getByLabel('Password', { exact: true }).fill(process.env[cfg.passEnv]!);
  await page.getByRole('button', { name: /^masuk$/i }).click();
  await page.waitForURL((url) => !POLA_MASUK.test(url.pathname + url.search), { timeout: 30_000 });
}

// Kembalikan context yang sudah login. Sesi tersimpan dipakai ulang selama
// masih hidup; kalau sudah mati (dialihkan ke /masuk), login ulang.
export async function loginAs(browser: Browser, peran: Peran): Promise<BrowserContext> {
  const file = statePath(peran);

  if (fs.existsSync(file)) {
    const context = await browser.newContext({ storageState: file });
    const page = await context.newPage();
    await page.goto(PERAN[peran].halamanDalam, { waitUntil: 'load' });
    // Streaming dapat menyelesaikan goto sebelum redirect server diterapkan.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const masihHidup = !POLA_MASUK.test(page.url());
    await page.close();
    if (masihHidup) return context;
    await context.close();
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await performLogin(page, peran);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await context.storageState({ path: file });
  await page.close();
  return context;
}
