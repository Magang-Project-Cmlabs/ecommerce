// Memilih opsi pada komponen Pilihan (src/components/ui/pilihan.tsx), pengganti <select> bawaan.
// Lewat label dan nama opsi yang terlihat pengguna, sama seperti pembeli memakainya.

import { expect, type Page } from '@playwright/test';

export async function pilihOpsi(page: Page, label: string | RegExp, opsi: string | RegExp | number): Promise<void> {
  await page.getByLabel(label, typeof label === 'string' ? { exact: true } : undefined).click();
  const daftar = page.getByRole('listbox');
  await expect(daftar).toBeVisible();
  const pilihan = typeof opsi === 'number'
    ? daftar.getByRole('option').nth(opsi)
    : daftar.getByRole('option', { name: opsi, exact: typeof opsi === 'string' });
  await pilihan.click();
  await expect(daftar).toBeHidden();
}

/** Nama opsi "Tindakan" di detail pesanan admin untuk tiap status tujuan. */
export const OPSI_TINDAKAN: Record<string, RegExp> = {
  confirmed: /^Konfirmasi (pembayaran manual|pesanan COD)$/,
  packed: /^Tandai telah dikemas$/,
  shipped: /^Kirim pesanan$/,
  cancelled: /^Batalkan/,
};
