// Jaring pengaman: proxy.ts hanya cek optimistis, dan cek di layout tidak
// cukup (layout tidak dirender ulang saat navigasi — panduan Next.js 16).
// Karena itu SETIAP page.tsx di rute terlindungi wajib memanggil penjaga
// server sendiri. Test ini gagal bila ada halaman baru yang lupa.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { config } from '@/proxy';
import { RUTE_WAJIB_MASUK, butuhMasuk } from './rute';

const APP = path.resolve(__dirname, '../../app');

/** Semua page.tsx beserta path URL-nya (segmen route group "(…)" dibuang). */
function daftarHalaman(dir = APP, segmen: string[] = []): { berkas: string; rute: string }[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return daftarHalaman(p, /^\(.*\)$/.test(e.name) ? segmen : [...segmen, e.name]);
    return /^page\.(tsx|ts|jsx|js)$/.test(e.name) ? [{ berkas: p, rute: '/' + segmen.join('/') }] : [];
  });
}

const halamanTerlindungi = daftarHalaman().filter((h) => butuhMasuk(h.rute));

describe('penjaga halaman terlindungi', () => {
  it('ada halaman terlindungi yang diperiksa (test tidak kosong)', () => {
    expect(halamanTerlindungi.length).toBeGreaterThan(0);
  });

  it.each(halamanTerlindungi.map((h) => [h.rute, h.berkas] as const))('%s memanggil penjaga server', (rute, berkas) => {
    // Komentar dan isi string dibuang dulu: tulisan "requireUser() WAJIB
    // dipertahankan" di komentar atau string tidak boleh dihitung sebagai
    // pemanggilan. Argumen penjaga ikut terhapus, tetapi "await requireUser("
    // tetap tersisa bila memang dipanggil.
    const isi = fs
      .readFileSync(berkas, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, '""');
    const penjaga =
      rute === '/admin' || rute.startsWith('/admin/') ? /\bawait\s+requireAdmin\(/ : /\bawait\s+require(User|Admin)\(/;
    // Penjaga harus berada di badan komponen halaman (default export) sebelum
    // `return` pertamanya — bukan sekadar ada di berkas, karena Server Action
    // di berkas yang sama bisa memanggil requireUser sementara halamannya lupa.
    const halaman = /export\s+default\s+(?:async\s+)?function\s*\w*\s*\([^)]*\)[^{]*\{([\s\S]*?)\breturn\b/.exec(isi);
    const nama = path.relative(process.cwd(), berkas);
    expect(halaman, `${nama}: komponen halaman harus "export default async function" dengan return`).not.toBeNull();
    expect(halaman![1], `${nama} harus memanggil ${rute.startsWith('/admin') ? 'requireAdmin' : 'requireUser'}() di awal komponen halaman, sebelum return`).toMatch(penjaga);
  });

  it('matcher proxy.ts mencakup semua rute terlindungi', () => {
    const matcher = ([] as string[]).concat(config.matcher);
    for (const r of RUTE_WAJIB_MASUK) expect(matcher).toContain(`${r}/:path*`);
    expect(matcher).toHaveLength(RUTE_WAJIB_MASUK.length);
  });
});
