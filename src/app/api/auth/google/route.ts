// Mulai Login Google (D21). State, PKCE verifier, nonce, dan tujuan `next` disimpan di
// cookie httpOnly berumur 10 menit yang hanya dikirim ke /api/auth/google.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { buatPermintaanGoogle, konfigGoogle } from '@/lib/auth/google';
import { COOKIE_GOOGLE, opsiCookieGoogle, redirectUriGoogle } from '@/lib/auth/google-cookie';
import { amanNext } from '@/lib/validations/auth';

export async function GET(request: NextRequest) {
  const konfig = konfigGoogle();
  if (!konfig) redirect('/masuk?galat=google-nonaktif');
  const permintaan = buatPermintaanGoogle(konfig, redirectUriGoogle());
  const next = amanNext(request.nextUrl.searchParams.get('next'));
  const isi = Buffer.from(JSON.stringify({ state: permintaan.state, verifier: permintaan.verifier, nonce: permintaan.nonce, next })).toString('base64url');
  (await cookies()).set(COOKIE_GOOGLE, isi, opsiCookieGoogle());
  redirect(permintaan.url);
}
