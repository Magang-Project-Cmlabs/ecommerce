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
