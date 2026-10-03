// Callback Login Google (D21): cocokkan state, tukar kode (PKCE), verifikasi ID token,
// tautkan/buat akun pembeli, lalu buat sesi yang sama seperti login password.
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { konfigGoogle, tukarKodeGoogle, verifikasiIdToken } from '@/lib/auth/google';
import { bacaCookieGoogle, COOKIE_GOOGLE, hapusCookieGoogle, redirectUriGoogle, stateSama } from '@/lib/auth/google-cookie';
import { hashPassword } from '@/lib/auth/password';
import { versiPassword } from '@/lib/auth/password-version';
import { simpanSesi } from '@/lib/auth/sesi';
import { masukAtauDaftarGoogle } from '@/lib/data/pengguna';
import { amanNext } from '@/lib/validations/auth';

export async function GET(request: NextRequest) {
  const toko = await cookies();
  const tersimpan = bacaCookieGoogle(toko.get(COOKIE_GOOGLE)?.value);
  toko.delete(hapusCookieGoogle);

  const konfig = konfigGoogle();
  if (!konfig) redirect('/masuk?galat=google-nonaktif');
  const p = request.nextUrl.searchParams;
  if (p.get('error')) redirect('/masuk?galat=google-batal');
  const code = p.get('code');
  if (!tersimpan || !code || code.length > 2000 || !stateSama(p.get('state'), tersimpan.state)) redirect('/masuk?galat=google');

  let tujuan: string;
  try {
    const idToken = await tukarKodeGoogle(konfig, { code, verifier: tersimpan.verifier, redirectUri: redirectUriGoogle() });
    const profil = await verifikasiIdToken(idToken, { clientId: konfig.clientId, nonce: tersimpan.nonce });
    // Akun baru dari Google mendapat password acak yang tidak diketahui siapa pun; bisa diatur lewat Lupa password.
    const hasil = await masukAtauDaftarGoogle(profil, await hashPassword(randomBytes(32).toString('base64url')));
    if (!hasil.ok) {
      tujuan = `/masuk?galat=google-${hasil.alasan}`;
    } else {
      await simpanSesi({ userId: hasil.akun.id, role: hasil.akun.role, passwordVersion: versiPassword(hasil.akun.passwordHash) });
      tujuan = amanNext(tersimpan.next) ?? '/';
    }
  } catch (error) {
    console.error('[google] login gagal:', error instanceof Error ? error.message : 'galat');
    tujuan = '/masuk?galat=google';
  }
  redirect(tujuan);
}
