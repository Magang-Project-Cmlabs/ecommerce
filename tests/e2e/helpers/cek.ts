// Pemeriksaan umum yang dipakai beberapa spec.

import { expect, type Page } from '@playwright/test';

// Kumpulkan error JavaScript dan console.error selama halaman dibuka.
// Pasang SEBELUM page.goto agar error saat hidrasi ikut tertangkap.
export function tangkapError(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

// Buka halaman dan pastikan responsnya bukan galat.
// Pakai 'load', bukan 'networkidle': dev server Next.js menjaga koneksi HMR
// sehingga 'networkidle' bisa tidak pernah tercapai dan tes gagal palsu.
export async function bukaHalaman(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'load' });
  expect(response, `tidak ada respons untuk ${path}`).not.toBeNull();
  expect(response!.status(), `status HTTP ${path}`).toBeLessThan(400);
  return response!;
}

// Satu <h1> per halaman (DESIGN.md §2, aksesibilitas).
export async function cekSatuH1(page: Page) {
  await expect(page.locator('h1')).toHaveCount(1);
}
