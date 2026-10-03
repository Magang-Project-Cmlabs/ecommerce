// Login Google (D21): OAuth 2.0 Authorization Code + PKCE, tanpa pustaka auth tambahan.
// ID token diverifikasi tanda tangannya dengan kunci publik Google (jose), lalu penerbit,
// audiens, kedaluwarsa, nonce, dan email_verified diperiksa. Server saja.
import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export const ALAMAT_OTORISASI = 'https://accounts.google.com/o/oauth2/v2/auth';
export const ALAMAT_TOKEN = 'https://oauth2.googleapis.com/token';
const ALAMAT_KUNCI = 'https://www.googleapis.com/oauth2/v3/certs';
const PENERBIT = ['https://accounts.google.com', 'accounts.google.com'];

export type KonfigGoogle = { clientId: string; clientSecret: string };
export type ProfilGoogle = { sub: string; email: string; name: string };
export type PermintaanGoogle = { url: string; state: string; verifier: string; nonce: string };

export function konfigGoogle(env: Record<string, string | undefined> = process.env): KonfigGoogle | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim(), clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

const acak = () => randomBytes(32).toString('base64url');
export const tantanganPkce = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');

/** URL persetujuan Google beserta nilai rahasia yang harus disimpan di cookie httpOnly. */
export function buatPermintaanGoogle(konfig: KonfigGoogle, redirectUri: string): PermintaanGoogle {
  const state = acak(), verifier = acak(), nonce = acak();
  const url = new URL(ALAMAT_OTORISASI);
  url.search = new URLSearchParams({
    client_id: konfig.clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile',
    state, nonce, code_challenge: tantanganPkce(verifier), code_challenge_method: 'S256', prompt: 'select_account',
  }).toString();
  return { url: url.toString(), state, verifier, nonce };
}

/** Tukar kode otorisasi menjadi ID token (server ke server, memakai client secret). */
export async function tukarKodeGoogle(
  konfig: KonfigGoogle, data: { code: string; verifier: string; redirectUri: string }, ambil: typeof fetch = fetch,
): Promise<string> {
  const respons = await ambil(ALAMAT_TOKEN, {
    method: 'POST', signal: AbortSignal.timeout(10_000), cache: 'no-store',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code: data.code, client_id: konfig.clientId, client_secret: konfig.clientSecret,
      redirect_uri: data.redirectUri, grant_type: 'authorization_code', code_verifier: data.verifier,
    }),
  });
  const isi = await respons.json().catch(() => null) as { id_token?: unknown } | null;
  if (!respons.ok || typeof isi?.id_token !== 'string') throw new Error('Penukaran kode Google gagal');
  return isi.id_token;
}

let kunciGoogle: JWTVerifyGetKey | null = null;
const kunciBawaan = () => (kunciGoogle ??= createRemoteJWKSet(new URL(ALAMAT_KUNCI)));

/** Verifikasi ID token; melempar galat bila tidak sah. */
export async function verifikasiIdToken(
  idToken: string, harapan: { clientId: string; nonce: string }, kunci: JWTVerifyGetKey = kunciBawaan(),
): Promise<ProfilGoogle> {
  const { payload } = await jwtVerify(idToken, kunci, { issuer: PENERBIT, audience: harapan.clientId, algorithms: ['RS256'] });
  if (payload.nonce !== harapan.nonce) throw new Error('Nonce Google tidak cocok');
  if (payload.email_verified !== true) throw new Error('Email Google belum terverifikasi');
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!payload.sub || !email || email.length > 191) throw new Error('Profil Google tidak lengkap');
  const nama = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : email.split('@')[0]!;
  return { sub: payload.sub, email, name: nama.slice(0, 100) };
}
