import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));
const kue = vi.hoisted(() => ({ nilai: undefined as string | undefined, dihapus: [] as unknown[] }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => (kue.nilai ? { value: kue.nilai } : undefined), delete: (x: unknown) => kue.dihapus.push(x) }), headers: async () => new Headers() }));
vi.mock('@/lib/auth/ip', () => ({ ipKlien: () => '203.0.113.9' }));
const catatBatasAuthDb = vi.hoisted(() => vi.fn(async () => ({ boleh: true })));
vi.mock('@/lib/data/batas-auth', () => ({ catatBatasAuthDb }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw Object.assign(new Error('REDIRECT'), { url }); } }));
const google = vi.hoisted(() => ({ tukar: vi.fn(), verifikasi: vi.fn() }));
vi.mock('@/lib/auth/google', () => ({
  konfigGoogle: () => ({ clientId: 'klien', clientSecret: 'rahasia' }),
  tukarKodeGoogle: google.tukar, verifikasiIdToken: google.verifikasi,
}));
vi.mock('@/lib/url-aplikasi', () => ({ urlAplikasi: () => 'https://toko.example' }));
vi.mock('@/lib/auth/password', () => ({ hashPassword: vi.fn(async () => 'hash-acak') }));
const simpanSesi = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/sesi', () => ({ simpanSesi }));
const masukAtauDaftarGoogle = vi.hoisted(() => vi.fn());
vi.mock('@/lib/data/pengguna', () => ({ masukAtauDaftarGoogle }));

import { GET } from './route';

const cookie = (isi: object) => Buffer.from(JSON.stringify(isi)).toString('base64url');
const panggil = async (query: string) => {
  try { await GET(new NextRequest(`https://toko.example/api/auth/google/callback?${query}`)); }
  catch (e) { return (e as { url?: string }).url; }
  return 'tanpa-redirect';
};
beforeEach(() => { vi.stubEnv('AUTH_SECRET', 'rahasia-sesi-uji-yang-panjangnya-cukup-32'); });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); kue.nilai = undefined; kue.dihapus = []; });

describe('callback Login Google (D21)', () => {
  it('menolak tanpa cookie atau state berbeda, tanpa menukar kode', async () => {
    expect(await panggil('code=abc&state=s1')).toBe('/masuk?galat=google');
    kue.nilai = cookie({ state: 's1', verifier: 'v', nonce: 'n', next: null });
    expect(await panggil('code=abc&state=palsu')).toBe('/masuk?galat=google');
    expect(google.tukar).not.toHaveBeenCalled();
    expect(kue.dihapus).toContainEqual({ name: 'tokokita_google', path: '/api/auth/google' });
  });

  it('pembatalan oleh pengguna di Google', async () => {
    kue.nilai = cookie({ state: 's1', verifier: 'v', nonce: 'n', next: null });
    expect(await panggil('error=access_denied&state=s1')).toBe('/masuk?galat=google-batal');
  });

  it('berhasil: sesi dibuat dan diarahkan ke next yang aman', async () => {
    kue.nilai = cookie({ state: 's1', verifier: 'ver', nonce: 'n1', next: '/checkout' });
    google.tukar.mockResolvedValue('id-token');
    google.verifikasi.mockResolvedValue({ sub: '1', email: 'a@gmail.com', name: 'A' });
    masukAtauDaftarGoogle.mockResolvedValue({ ok: true, akun: { id: 9, role: 'customer', passwordHash: 'h' } });
    expect(await panggil('code=abc&state=s1')).toBe('/checkout');
    expect(google.tukar).toHaveBeenCalledWith({ clientId: 'klien', clientSecret: 'rahasia' }, { code: 'abc', verifier: 'ver', redirectUri: 'https://toko.example/api/auth/google/callback' });
    expect(google.verifikasi).toHaveBeenCalledWith('id-token', { clientId: 'klien', nonce: 'n1' });
    expect(simpanSesi).toHaveBeenCalledWith(expect.objectContaining({ userId: 9, role: 'customer' }));
  });

  it('next berbahaya diabaikan', async () => {
    kue.nilai = cookie({ state: 's1', verifier: 'v', nonce: 'n', next: '//evil.example' });
    google.tukar.mockResolvedValue('t'); google.verifikasi.mockResolvedValue({ sub: '1', email: 'a@gmail.com', name: 'A' });
    masukAtauDaftarGoogle.mockResolvedValue({ ok: true, akun: { id: 9, role: 'customer', passwordHash: 'h' } });
    expect(await panggil('code=abc&state=s1')).toBe('/');
  });

  it('dibatasi per IP sebelum memanggil Google', async () => {
    kue.nilai = cookie({ state: 's1', verifier: 'v', nonce: 'n', next: null });
    catatBatasAuthDb.mockResolvedValueOnce({ boleh: false, tungguDetik: 60 } as never);
    expect(await panggil('code=abc&state=s1')).toBe('/masuk?galat=google-sering');
    expect(catatBatasAuthDb).toHaveBeenCalledWith('google:203.0.113.9', undefined, expect.any(Date), { maks: 20, jendelaMs: 900_000 });
    expect(google.tukar).not.toHaveBeenCalled();
  });

  it('akun admin atau token tidak sah tidak mendapat sesi', async () => {
    kue.nilai = cookie({ state: 's1', verifier: 'v', nonce: 'n', next: null });
    google.tukar.mockResolvedValue('t'); google.verifikasi.mockResolvedValue({ sub: '1', email: 'admin@tokokita.id', name: 'A' });
    masukAtauDaftarGoogle.mockResolvedValue({ ok: false, alasan: 'admin' });
    expect(await panggil('code=abc&state=s1')).toBe('/masuk?galat=google-admin');
    google.verifikasi.mockRejectedValue(new Error('Nonce Google tidak cocok'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await panggil('code=abc&state=s1')).toBe('/masuk?galat=google');
    expect(simpanSesi).not.toHaveBeenCalled();
  });
});
