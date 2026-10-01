// Token sesi TokoKita: JWT HS256 (jose) berisi id pengguna + role saja.
//
// Sengaja tanpa impor Next.js supaya bisa dipakai di proxy.ts (kartu "Batasi
// halaman yang butuh login") dan diuji tanpa server. Cookie diatur di sesi.ts.

import { SignJWT, jwtVerify } from 'jose';

export type Role = 'customer' | 'admin';
export type IsiSesi = { userId: number; role: Role; passwordVersion?: string };

/** Nama cookie sesi; dipakai sesi.ts (server) dan proxy.ts. */
export const NAMA_COOKIE_SESI = 'tokokita_sesi';

/** Cookie sesi berlaku 30 hari (PRD §13). */
export const MASA_SESI_DETIK = 30 * 24 * 60 * 60;

const PLACEHOLDER = 'ganti-dengan-string-acak-minimal-32-karakter';
const ROLE_SAH: readonly Role[] = ['customer', 'admin'];

export function kunciDariRahasia(rahasia: string | undefined, env = process.env.NODE_ENV): Uint8Array {
  if (!rahasia) throw new Error('AUTH_SECRET belum diisi di .env');
  if (rahasia.length < 32) throw new Error('AUTH_SECRET minimal 32 karakter');
  if (env === 'production' && rahasia === PLACEHOLDER) {
    throw new Error('AUTH_SECRET masih placeholder dari .env.example; buat kunci acak baru untuk production');
  }
  return new TextEncoder().encode(rahasia);
}

export async function buatTokenSesi(
  isi: IsiSesi,
  kunci: Uint8Array,
  sekarangDetik = Math.floor(Date.now() / 1000),
): Promise<string> {
  return new SignJWT({ role: isi.role, ...(isi.passwordVersion ? { pv: isi.passwordVersion } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(isi.userId))
    .setIssuedAt(sekarangDetik)
    .setExpirationTime(sekarangDetik + MASA_SESI_DETIK)
    .sign(kunci);
}

/** Isi sesi bila token sah dan belum kedaluwarsa; selain itu null (tidak pernah melempar). */
export async function bacaTokenSesi(token: string | undefined, kunci: Uint8Array): Promise<IsiSesi | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci, { algorithms: ['HS256'] });
    const role = payload.role as Role;
    if (!ROLE_SAH.includes(role)) return null;
    if (!payload.sub || !/^[1-9]\d*$/.test(payload.sub)) return null;
    if (payload.pv !== undefined && (typeof payload.pv !== 'string' || !/^[a-f0-9]{64}$/.test(payload.pv))) return null;
    return { userId: Number(payload.sub), role, ...(typeof payload.pv === 'string' ? { passwordVersion: payload.pv } : {}) };
  } catch {
    return null;
  }
}
