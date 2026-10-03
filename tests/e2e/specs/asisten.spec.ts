// Asisten AI (D18): panel terbuka dari tombol melayang, pesan sensitif ditolak tanpa memanggil AI,
// dan pertanyaan biasa mendapat jawaban atau pesan jelas bila AI belum aktif di lingkungan uji.

import { test, expect } from '@playwright/test';
import { alasanLewati, hasCredentials, performLogin } from '../helpers/auth';

test('asisten AI: buka panel, tolak data sensitif, jawab atau beri pesan jelas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Tanya AI/ }).click();
  const panel = page.getByRole('dialog', { name: 'Asisten TokoKita' });
  await expect(panel).toBeVisible();
  const kolom = panel.getByLabel('Pertanyaan untuk asisten');
  await expect(kolom).toBeFocused();

  await kolom.fill('nomor kartu saya 4111 1111 1111 1111'); await kolom.press('Enter');
  await expect(panel.getByRole('log')).toContainText('Demi keamanan, jangan bagikan nomor kartu');
  await expect(panel.getByRole('log')).toContainText('•••• (disamarkan)');
  await expect(panel.getByRole('log')).not.toContainText('4111 1111');

  await kolom.fill('Metode pembayaran apa saja?'); await panel.getByRole('button', { name: 'Kirim pertanyaan' }).click();
  await expect(panel.getByRole('log')).toContainText(/QRIS|BCA|Mandiri|COD|belum aktif|belum bisa menjawab|ramai/, { timeout: 45_000 });

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await page.getByRole('button', { name: /^Tanya AI/ }).click();
  await expect(panel.getByRole('log')).toContainText('Metode pembayaran apa saja?');
});

test('asisten tidak tampil di checkout', async ({ page }) => {
  test.skip(!hasCredentials('customer'), alasanLewati('customer'));
  await performLogin(page, 'customer');
  await page.goto('/checkout'); await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByRole('button', { name: /^Tanya AI/ })).toHaveCount(0);
});
