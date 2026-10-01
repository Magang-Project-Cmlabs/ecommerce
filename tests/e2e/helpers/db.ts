// Akses database untuk tes yang tidak bisa dibuktikan lewat UI saja — mis.
// token reset password yang hanya dikirim lewat email. Dipakai seperlunya:
// alur yang dilihat pembeli tetap dijalankan lewat browser.
//
// Kueri berjalan di proses terpisah (db-cli.ts lewat tsx) dengan DATABASE_URL
// dari .env di root proyek, sama dengan dev server.

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const jalan = promisify(execFile);
const ROOT = path.join(__dirname, '..', '..', '..');
const CLI = path.join(__dirname, 'db-cli.ts');

async function panggil<T>(...args: string[]): Promise<T> {
  const { stdout } = await jalan(process.execPath, ['--import', 'tsx', CLI, ...args], { cwd: ROOT });
  return JSON.parse(stdout) as T;
}
export type AdminOrderFixture = { orderId: number; productId: number; orderNumber: string };
export const buatPesananAdminUji = (email: string) => panggil<AdminOrderFixture>('admin-order-fixture', email);
export type MetodeSandbox = 'bank_bca' | 'bank_mandiri' | 'qris';
export const buatPesananSandboxUji = (email: string, metode: MetodeSandbox = 'bank_bca') => panggil<AdminOrderFixture>('admin-order-fixture', email, 'sandbox', metode);
export const bacaPesananAdminUji = (email: string, orderId: number) => panggil<{ status: string; paymentStatus: string; paymentTransactionId: string | null; grandTotal: number; trackingNumber: string | null; logs: number; stock: number }>('admin-order-state', email, String(orderId));
export const hapusPesananAdminUji = (email: string, fixture: AdminOrderFixture) => panggil<boolean>('admin-clean-fixture', email, JSON.stringify(fixture));
export const mundurkanBatasBayarUji = (email: string, orderNumber: string) => panggil<boolean>('admin-lewat-batas', email, orderNumber);
export const hapusProdukAdminUji = (email: string, slug: string) => panggil<boolean>('admin-clean-product', email, slug);
export const hapusKontenAdminUji = (email: string, stamp: string) => panggil<boolean>('admin-clean-content', email, stamp);

/** Jumlah token reset milik akun dengan email ini. */
export function jumlahTokenReset(email: string): Promise<number> {
  return panggil<number>('jumlah-token', email);
}

/**
 * Ganti token milik akun dengan token uji yang nilainya diketahui tes (token
 * asli hanya ada di email). Kembalikan token mentah untuk dibuka di browser.
 */
export function pasangTokenResetUji(email: string, berlakuMs = 60 * 60 * 1000): Promise<string> {
  return panggil<string>('pasang-token', email, String(berlakuMs));
}
