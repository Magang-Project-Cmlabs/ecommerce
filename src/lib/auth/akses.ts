// Penjaga akses di server — lapis yang benar-benar mengamankan halaman dan
// Server Action. proxy.ts hanya pengalih optimistis (cookie saja); cek di
// layout tidak cukup karena layout tidak dirender ulang saat navigasi.
//
// Wajib dipanggil di baris awal setiap page.tsx di /checkout, /akun,
// /wishlist, /admin (dijaga test penjaga-halaman.test.ts) dan di setiap
// Server Action yang menyentuh data milik pengguna atau data admin.

import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { urlMasuk } from './rute';

/**
 * Pengguna yang sedang masuk dan akunnya masih ada di database. Selain itu
 * redirect ke /masuk?next=<pathSaatIni>. Memakai ambilPenggunaSaatIni(), bukan
 * isi token saja, karena JWT tetap sah sampai kedaluwarsa walau akun dihapus.
 *
 * Query string tidak ikut di next (halaman hanya tahu path statisnya). Jalur
 * normal tidak terdampak: tamu sudah dialihkan proxy.ts beserta query-nya;
 * redirect ini hanya terjadi bila cookie sah tetapi akunnya sudah tidak ada.
 */
export async function requireUser(pathSaatIni: string) {
  const pengguna = await ambilPenggunaSaatIni();
  if (!pengguna) redirect(urlMasuk(pathSaatIni));
  return pengguna;
}

/**
 * Seperti requireUser, tetapi hanya untuk role admin. Pengguna lain mendapat
 * 404 supaya keberadaan panel admin tidak terungkap.
 */
export async function requireAdmin(pathSaatIni: string) {
  const pengguna = await requireUser(pathSaatIni);
  if (pengguna.role !== 'admin') notFound();
  return pengguna;
}
