import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));
const disetel = vi.hoisted(() => [] as [string, string, Record<string, unknown>][]);
vi.mock('next/headers', () => ({ cookies: async () => ({ set: (n: string, v: string, o: Record<string, unknown>) => disetel.push([n, v, o]) }) }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw Object.assign(new Error('REDIRECT'), { url }); } }));
const konfig = vi.hoisted(() => ({ nilai: { clientId: 'klien', clientSecret: 'rahasia' } as { clientId: string; clientSecret: string } | null }));
vi.mock('@/lib/url-aplikasi', () => ({ urlAplikasi: () => 'https://toko.example' }));
vi.mock('@/lib/auth/google', async (asli) => ({ ...(await asli<typeof import('@/lib/auth/google')>()), konfigGoogle: () => konfig.nilai }));

import { GET } from './route';

const panggil = async (query = '') => {
  try { await GET(new NextRequest(`https://toko.example/api/auth/google${query}`)); } catch (e) { return (e as { url?: string }).url; }
  return 'tanpa-redirect';
};
afterEach(() => { disetel.length = 0; konfig.nilai = { clientId: 'klien', clientSecret: 'rahasia' }; });

describe('mulai Login Google (D21)', () => {
  it('menyimpan state/PKCE/nonce di cookie httpOnly lalu ke Google', async () => {
    const tujuan = await panggil('?next=%2Fcheckout');
    expect(new URL(tujuan!).hostname).toBe('accounts.google.com');
    const [nama, nilai, opsi] = disetel[0]!;
    expect(nama).toBe('tokokita_google');
    expect(opsi).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/api/auth/google', maxAge: 600 });
    const isi = JSON.parse(Buffer.from(nilai, 'base64url').toString());
    expect(isi.next).toBe('/checkout');
    expect(new URL(tujuan!).searchParams.get('state')).toBe(isi.state);
    expect(new URL(tujuan!).searchParams.get('redirect_uri')).toBe('https://toko.example/api/auth/google/callback');
  });
  it('next dari luar situs dibuang', async () => {
    await panggil('?next=https%3A%2F%2Fevil.example');
    expect(JSON.parse(Buffer.from(disetel[0]![1], 'base64url').toString()).next).toBeNull();
  });
  it('tanpa konfigurasi kembali ke halaman masuk', async () => {
    konfig.nilai = null;
    expect(await panggil()).toBe('/masuk?galat=google-nonaktif');
    expect(disetel).toHaveLength(0);
  });
});
