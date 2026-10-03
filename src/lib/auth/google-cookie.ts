// Cookie sementara Login Google (D21) dan alamat callback. Server saja.
import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { urlAplikasi } from '@/lib/url-aplikasi';

export const COOKIE_GOOGLE = 'tokokita_google';
const PATH = '/api/auth/google';

export const redirectUriGoogle = () => `${urlAplikasi(process.env)}${PATH}/callback`;

export const opsiCookieGoogle = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: PATH, maxAge: 600,
});
export const hapusCookieGoogle = { name: COOKIE_GOOGLE, path: PATH };

export type IsiCookieGoogle = { state: string; verifier: string; nonce: string; next: string | null };

export function bacaCookieGoogle(nilai: string | undefined): IsiCookieGoogle | null {
  if (!nilai || nilai.length > 2000) return null;
  try {
    const isi = JSON.parse(Buffer.from(nilai, 'base64url').toString('utf8')) as Partial<IsiCookieGoogle>;
    if (typeof isi.state !== 'string' || typeof isi.verifier !== 'string' || typeof isi.nonce !== 'string') return null;
    return { state: isi.state, verifier: isi.verifier, nonce: isi.nonce, next: typeof isi.next === 'string' ? isi.next : null };
  } catch {
    return null;
  }
}

/** Perbandingan waktu-konstan untuk parameter state. */
export function stateSama(a: string | null, b: string): boolean {
  if (!a) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
