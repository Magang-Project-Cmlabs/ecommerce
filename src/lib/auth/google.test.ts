import { describe, expect, it, vi } from 'vitest';
import { SignJWT, generateKeyPair, type JWTVerifyGetKey } from 'jose';
vi.mock('server-only', () => ({}));
import { buatPermintaanGoogle, konfigGoogle, tantanganPkce, tukarKodeGoogle, verifikasiIdToken, ALAMAT_TOKEN } from './google';

const konfig = { clientId: 'klien-uji.apps.googleusercontent.com', clientSecret: 'rahasia-uji' };

async function siapkanKunci() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const kunci: JWTVerifyGetKey = async () => publicKey;
  const tanda = (klaim: Record<string, unknown>, opsi: { iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT(klaim).setProtectedHeader({ alg: 'RS256' }).setIssuer(opsi.iss ?? 'https://accounts.google.com')
      .setAudience(opsi.aud ?? konfig.clientId).setIssuedAt().setExpirationTime(opsi.exp ?? '5m').sign(privateKey);
  return { kunci, tanda };
}

describe('konfigurasi Login Google (D21)', () => {
  it('aktif hanya bila client id dan secret terisi', () => {
    expect(konfigGoogle({})).toBeNull();
    expect(konfigGoogle({ GOOGLE_CLIENT_ID: 'a' })).toBeNull();
    expect(konfigGoogle({ GOOGLE_CLIENT_ID: ' a ', GOOGLE_CLIENT_SECRET: ' b ' })).toEqual({ clientId: 'a', clientSecret: 'b' });
  });
});

describe('permintaan otorisasi', () => {
  it('memakai PKCE S256, state, nonce, dan scope minimal; tanpa client secret di URL', () => {
    const p = buatPermintaanGoogle(konfig, 'https://toko.example/api/auth/google/callback');
    const url = new URL(p.url);
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: konfig.clientId, redirect_uri: 'https://toko.example/api/auth/google/callback', response_type: 'code',
      scope: 'openid email profile', state: p.state, nonce: p.nonce, code_challenge: tantanganPkce(p.verifier), code_challenge_method: 'S256',
    });
    expect(p.url).not.toContain(konfig.clientSecret);
    expect(p.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const lain = buatPermintaanGoogle(konfig, 'x');
    expect(lain.state).not.toBe(p.state); expect(lain.nonce).not.toBe(p.nonce);
  });
  it('tantangan PKCE sesuai RFC 7636 (contoh lampiran B)', () => {
    expect(tantanganPkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('tukar kode', () => {
  it('POST form ke endpoint token dengan code_verifier', async () => {
    const ambil = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id_token: 'tkn' }), { status: 200 }));
    expect(await tukarKodeGoogle(konfig, { code: 'kode', verifier: 'ver', redirectUri: 'https://x/cb' }, ambil)).toBe('tkn');
    const [alamat, init] = ambil.mock.calls[0]!;
    expect(alamat).toBe(ALAMAT_TOKEN);
    expect(init.method).toBe('POST');
    expect(Object.fromEntries(init.body as URLSearchParams)).toMatchObject({ code: 'kode', code_verifier: 'ver', grant_type: 'authorization_code', redirect_uri: 'https://x/cb' });
  });
  it('gagal bila Google menolak', async () => {
    const ambil = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }));
    await expect(tukarKodeGoogle(konfig, { code: 'k', verifier: 'v', redirectUri: 'r' }, ambil)).rejects.toThrow();
  });
});

describe('verifikasi ID token', () => {
  const dasar = { sub: '1098765', email: 'Pembeli@Gmail.com', email_verified: true, name: 'Pembeli Google', nonce: 'n-1' };
  it('menerima token sah dan menormalkan email', async () => {
    const { kunci, tanda } = await siapkanKunci();
    expect(await verifikasiIdToken(await tanda(dasar), { clientId: konfig.clientId, nonce: 'n-1' }, kunci))
      .toEqual({ sub: '1098765', email: 'pembeli@gmail.com', name: 'Pembeli Google' });
  });
  it.each([
    ['nonce berbeda', { ...dasar, nonce: 'lain' }, {}],
    ['email belum terverifikasi', { ...dasar, email_verified: false }, {}],
    ['tanpa email', { ...dasar, email: undefined }, {}],
    ['audiens lain', dasar, { aud: 'aplikasi-lain' }],
    ['penerbit palsu', dasar, { iss: 'https://evil.example' }],
    ['kedaluwarsa', dasar, { exp: '-1m' }],
  ])('menolak token: %s', async (_judul, klaim, opsi) => {
    const { kunci, tanda } = await siapkanKunci();
    await expect(verifikasiIdToken(await tanda(klaim as Record<string, unknown>, opsi), { clientId: konfig.clientId, nonce: 'n-1' }, kunci)).rejects.toThrow();
  });
  it('menolak token yang ditandatangani kunci lain', async () => {
    const asli = await siapkanKunci(), palsu = await siapkanKunci();
    await expect(verifikasiIdToken(await palsu.tanda(dasar), { clientId: konfig.clientId, nonce: 'n-1' }, asli.kunci)).rejects.toThrow();
  });
});
