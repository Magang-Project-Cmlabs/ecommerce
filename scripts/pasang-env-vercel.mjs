// Memasang isi berkas env lokal (mis. .env.r2, .env.smtp) ke Vercel Preview + Production
// tanpa mencetak nilainya. Pakai: node scripts/pasang-env-vercel.mjs .env.r2
// Butuh `npx vercel login` dan folder sudah ditautkan (`.vercel/`).
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const berkas = process.argv[2];
if (!berkas || !existsSync(berkas)) {
  console.error('Pakai: node scripts/pasang-env-vercel.mjs <berkas>, contoh .env.r2 atau .env.smtp');
  process.exit(1);
}

const isi = Object.fromEntries(readFileSync(berkas, 'utf8').split(/\r?\n/)
  .map((baris) => baris.trim()).filter((baris) => baris && !baris.startsWith('#') && baris.includes('='))
  .map((baris) => { const i = baris.indexOf('='); return [baris.slice(0, i).trim(), baris.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));

const KELOMPOK = {
  r2: { wajib: ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_PUBLIC_URL'], tambahan: { STORAGE_DRIVER: 's3' } },
  smtp: { wajib: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'], tambahan: {} },
};
const jenis = Object.keys(isi).some((k) => k.startsWith('S3_')) ? 'r2' : Object.keys(isi).some((k) => k.startsWith('SMTP_')) ? 'smtp' : null;
if (!jenis) { console.error('Berkas tidak berisi S3_* atau SMTP_*.'); process.exit(1); }

const kurang = KELOMPOK[jenis].wajib.filter((k) => !isi[k]);
if (kurang.length) { console.error(`Belum diisi: ${kurang.join(', ')}`); process.exit(1); }
const salah = [];
if (jenis === 'r2') {
  if (!/^https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/?$/.test(isi.S3_ENDPOINT)) salah.push('S3_ENDPOINT harus https://<id-akun>.r2.cloudflarestorage.com');
  if (!/^https:\/\//.test(isi.S3_PUBLIC_URL)) salah.push('S3_PUBLIC_URL harus diawali https://');
}
if (jenis === 'smtp') {
  if (!['465', '587'].includes(isi.SMTP_PORT)) salah.push('SMTP_PORT biasanya 587 atau 465');
  if (!/@/.test(isi.MAIL_FROM)) salah.push('MAIL_FROM harus memuat alamat email, mis. TokoKita <toko@gmail.com>');
}
if (salah.length) { console.error(salah.join('\n')); process.exit(1); }

// Google menampilkan sandi aplikasi dalam empat kelompok berspasi; spasinya tidak bagian dari sandi.
if (isi.SMTP_PASS) isi.SMTP_PASS = isi.SMTP_PASS.replace(/\s+/g, '');

const RAHASIA = new Set(['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'SMTP_PASS', 'SMTP_USER']);
const pasangan = { ...Object.fromEntries(KELOMPOK[jenis].wajib.map((k) => [k, isi[k]])), ...KELOMPOK[jenis].tambahan };
const vercel = (args, input) => spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vercel', ...args], { input, encoding: 'utf8', shell: process.platform === 'win32' });

let gagal = 0;
for (const target of ['preview', 'production']) {
  for (const [kunci, nilai] of Object.entries(pasangan)) {
    vercel(['env', 'rm', kunci, target, '--yes']);
    const hasil = vercel(['env', 'add', kunci, target, ...(RAHASIA.has(kunci) ? ['--sensitive'] : []), '--yes'], nilai);
    const ok = hasil.status === 0;
    if (!ok) gagal++;
    console.log(`${target.padEnd(10)} ${kunci.padEnd(16)} ${ok ? 'OK terpasang' : 'GAGAL'}`);
  }
}
console.log(gagal ? `\n${gagal} pengaturan gagal. Kirim tulisan GAGAL di atas ke pengembang.` : '\nSelesai. Beri tahu pengembang agar deploy ulang.');
process.exit(gagal ? 1 : 0);
