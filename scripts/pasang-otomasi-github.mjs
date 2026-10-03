// Menyiapkan dua jadwal otomatis di repo pribadi kvnlhm/ecommerce (branch `sinkron`):
//   - "Pesanan otomatis" tiap jam: memanggil /api/cron/orders produksi.
//   - "Backup database" harian: dump Aiven terenkripsi, disimpan 30 hari.
// Yang dilakukan skrip (nilai rahasia tidak pernah dicetak):
//   1. Membuat/melengkapi .env.otomasi (CRON_SECRET baru, kunci backup, password
//      pengguna backup). Berkas ini Git-ignored; BACKUP_KUNCI perlu untuk membuka backup.
//   2. Membuat pengguna MySQL khusus baca `tokokita_backup` di Aiven.
//   3. Memasang CRON_SECRET ke Vercel (Preview + Production).
//   4. Mengisi secret dan variabel GitHub Actions di repo pribadi.
// Butuh: .env.aiven, `gh auth login` (akun pemilik repo), `npx vercel login`.
// Pakai: node scripts/pasang-otomasi-github.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import mariadb from 'mariadb';

const REPO = 'kvnlhm/ecommerce';
const APP_URL = 'https://ecommerce-peach-seven-47.vercel.app';
const BERKAS = '.env.otomasi';
const PENGGUNA_BACKUP = 'tokokita_backup';
const windows = process.platform === 'win32';

const baca = (f) => (existsSync(f) ? parseEnv(readFileSync(f, 'utf8')) : {});
const jalankan = (perintah, args, input) =>
  spawnSync(perintah, args, { input, encoding: 'utf8', shell: windows });
const berhenti = (pesan) => { console.error(pesan); process.exit(1); };

const aiven = baca('.env.aiven');
if (!aiven.DATABASE_URL || !aiven.DATABASE_CA_CERT) berhenti('.env.aiven harus berisi DATABASE_URL dan DATABASE_CA_CERT.');
if (jalankan('gh', ['auth', 'status']).status !== 0) berhenti('Belum login GitHub CLI. Jalankan: gh auth login');

// 1. Nilai rahasia: pakai yang sudah ada agar skrip aman diulang.
const simpan = baca(BERKAS);
simpan.CRON_SECRET ||= randomBytes(32).toString('hex');
simpan.BACKUP_KUNCI ||= randomBytes(32).toString('base64url');
simpan.BACKUP_DB_PASSWORD ||= randomBytes(24).toString('hex');
writeFileSync(BERKAS, [
  '# Dibuat scripts/pasang-otomasi-github.mjs. Jangan di-commit atau dibagikan.',
  '# BACKUP_KUNCI dibutuhkan untuk membuka berkas backup (docs/runbooks/backup-restore.md).',
  ...Object.entries(simpan).map(([k, v]) => `${k}="${v}"`), '',
].join('\n'), { mode: 0o600 });
console.log(`OK  ${BERKAS} siap (simpan baik-baik, berisi kunci pembuka backup)`);

// 2. Pengguna MySQL khusus baca untuk backup.
const url = new URL(aiven.DATABASE_URL);
const ca = aiven.DATABASE_CA_CERT.replaceAll('\\n', '\n');
const namaDb = decodeURIComponent(url.pathname.replace(/^\//, ''));
if (!/^[A-Za-z0-9_]+$/.test(namaDb)) berhenti('Nama database di DATABASE_URL tidak wajar.');
let urlBackup;
let koneksi;
try {
  koneksi = await mariadb.createConnection({
    host: url.hostname, port: Number(url.port || 3306), database: namaDb,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    ssl: { ca, rejectUnauthorized: true }, connectTimeout: 15_000,
  });
  await koneksi.query(`CREATE USER IF NOT EXISTS '${PENGGUNA_BACKUP}'@'%' IDENTIFIED BY ?`, [simpan.BACKUP_DB_PASSWORD]);
  await koneksi.query(`ALTER USER '${PENGGUNA_BACKUP}'@'%' IDENTIFIED BY ?`, [simpan.BACKUP_DB_PASSWORD]);
  await koneksi.query(`GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES ON \`${namaDb}\`.* TO '${PENGGUNA_BACKUP}'@'%'`);
  const tujuan = new URL(`mysql://${url.host}/${namaDb}`);
  tujuan.username = PENGGUNA_BACKUP;
  tujuan.password = simpan.BACKUP_DB_PASSWORD;
  urlBackup = tujuan.toString();
  console.log(`OK  pengguna MySQL khusus baca '${PENGGUNA_BACKUP}' siap`);
} catch (galat) {
  // Pesan galat driver bisa memuat alamat; cukup tampilkan kodenya.
  console.log(`!!  pengguna backup gagal dibuat (${galat?.code ?? 'galat'}); backup memakai akun utama Aiven`);
  urlBackup = aiven.DATABASE_URL;
} finally {
  await koneksi?.end().catch(() => {});
}

let gagal = 0;
const lapor = (ok, label) => { if (!ok) gagal++; console.log(`${ok ? 'OK ' : 'GAGAL'} ${label}`); };

// 3. CRON_SECRET yang sama di Vercel (dipakai juga oleh cron harian Vercel).
for (const target of ['preview', 'production']) {
  jalankan(windows ? 'npx.cmd' : 'npx', ['vercel', 'env', 'rm', 'CRON_SECRET', target, '--yes']);
  const hasil = jalankan(windows ? 'npx.cmd' : 'npx', ['vercel', 'env', 'add', 'CRON_SECRET', target, '--sensitive', '--yes'], simpan.CRON_SECRET);
  lapor(hasil.status === 0, `Vercel ${target}: CRON_SECRET`);
}

// 4. Secret dan variabel GitHub Actions (nilai dikirim lewat stdin).
const secretGithub = {
  CRON_SECRET: simpan.CRON_SECRET,
  BACKUP_DATABASE_URL: urlBackup,
  DATABASE_CA_CERT: ca,
  BACKUP_KUNCI: simpan.BACKUP_KUNCI,
};
for (const [nama, nilai] of Object.entries(secretGithub)) {
  lapor(jalankan('gh', ['secret', 'set', nama, '--repo', REPO], nilai).status === 0, `GitHub secret ${nama}`);
}
lapor(jalankan('gh', ['variable', 'set', 'APP_URL', '--repo', REPO, '--body', APP_URL]).status === 0, 'GitHub variabel APP_URL');

console.log(gagal
  ? `\n${gagal} langkah gagal. Kirim tulisan GAGAL di atas ke pengembang.`
  : '\nSelesai. Beri tahu pengembang agar deploy ulang produksi dan menguji kedua jadwal.');
process.exit(gagal ? 1 : 0);
