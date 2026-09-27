// Cookie sesi TokoKita (PRD §13): httpOnly, sameSite=lax, secure di production,
// berlaku 30 hari. Hanya untuk server; cookie hanya boleh diubah di Server
// Action atau Route Handler (aturan Next.js 16).

import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { MASA_SESI_DETIK, NAMA_COOKIE_SESI, bacaTokenSesi, buatTokenSesi, kunciDariRahasia, type IsiSesi } from './token';

export { NAMA_COOKIE_SESI };

const kunci = () => kunciDariRahasia(process.env.AUTH_SECRET);

export async function simpanSesi(isi: IsiSesi): Promise<void> {
  const token = await buatTokenSesi(isi, kunci());
  (await cookies()).set(NAMA_COOKIE_SESI, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MASA_SESI_DETIK,
  });
}

export async function hapusSesi(): Promise<void> {
  (await cookies()).delete(NAMA_COOKIE_SESI);
}

/**
 * Isi token sesi (id + role) tanpa menyentuh database. JANGAN dipakai untuk
 * keputusan akses (proxy, admin, checkout): JWT tetap sah sampai kedaluwarsa
 * walau pengguna keluar atau akunnya dihapus. Pakai ambilPenggunaSaatIni() di
 * src/lib/data/pengguna.ts yang memastikan akunnya masih ada.
 */
export const ambilSesi = cache(async (): Promise<IsiSesi | null> =>
  bacaTokenSesi((await cookies()).get(NAMA_COOKIE_SESI)?.value, kunci()),
);
