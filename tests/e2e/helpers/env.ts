// Pembaca .env sederhana khusus untuk tes.
//
// Tes memakai `tests/e2e/.env.e2e` (tidak ikut ter-commit) agar kredensial uji
// tidak pernah tertulis di kode. Bila berkasnya tidak ada, tes yang butuh login
// melewatkan dirinya sendiri, bukan gagal.

import fs from 'node:fs';
import path from 'node:path';

export const ENV_FILE = path.join(__dirname, '..', '.env.e2e');

export function loadEnv(file = ENV_FILE): boolean {
  if (!fs.existsSync(file)) return false;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (/^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return true;
}
