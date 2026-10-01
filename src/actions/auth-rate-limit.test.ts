import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers({ 'x-vercel-forwarded-for': '203.0.113.8' })) }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/lib/auth/pembatas-auth', () => ({ catatBatasAuth: vi.fn(), hapusBatasAuth: vi.fn() }));
vi.mock('@/lib/auth/sesi', () => ({ simpanSesi: vi.fn(), hapusSesi: vi.fn() }));
vi.mock('@/lib/data/pengguna', () => ({ buatAkunPembeli: vi.fn(), cariAkunUntukMasuk: vi.fn() }));
vi.mock('@/lib/data/reset-password', () => ({ cariAkunUntukReset: vi.fn(), pakaiTokenReset: vi.fn(), simpanTokenReset: vi.fn(), tokenResetMasihBerlaku: vi.fn() }));
vi.mock('@/lib/auth/password', () => ({ cocokkanPassword: vi.fn(async () => true), cocokkanPasswordPalsu: vi.fn(), hashPassword: vi.fn(async () => 'hash') }));
vi.mock('@/lib/email', () => ({ kirimEmail: vi.fn() }));
import { headers } from 'next/headers';
import { after } from 'next/server';
import { catatBatasAuth, hapusBatasAuth } from '@/lib/auth/pembatas-auth';
import { simpanSesi } from '@/lib/auth/sesi';
import { buatAkunPembeli, cariAkunUntukMasuk } from '@/lib/data/pengguna';
import { hashPassword } from '@/lib/auth/password';
import { pakaiTokenReset, tokenResetMasihBerlaku } from '@/lib/data/reset-password';
import { daftar, masuk, lupaPassword, resetPassword } from './auth';
const form = () => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: 'Pembeli Test', email: 'buyer@example.test', phone: '081234567890', password: 'password123', confirmPassword: 'password123', agree: 'on' })) data.set(key, value);
  return data;
};
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('VERCEL', '1'); vi.stubEnv('AUTH_SECRET', 'rate-limit-test-secret-at-least-32-characters'); vi.spyOn(console, 'error').mockImplementation(() => {}); vi.mocked(headers).mockResolvedValue(new Headers({ 'x-vercel-forwarded-for': '203.0.113.8' }) as Awaited<ReturnType<typeof headers>>); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('auth rate limit fail closed', () => {
  it('reset dengan token format sah yang tidak ditemukan tidak melakukan bcrypt atau consume', async () => {
    vi.mocked(catatBatasAuth).mockResolvedValueOnce({ boleh: true }); vi.mocked(tokenResetMasihBerlaku).mockResolvedValueOnce(false);
    const data = form(); data.set('token', 'a'.repeat(43));
    expect((await resetPassword(undefined, data))?.message).toContain('Link reset tidak berlaku');
    expect(catatBatasAuth).toHaveBeenCalledWith('reset-password:203.0.113.8'); expect(hashPassword).not.toHaveBeenCalled(); expect(pakaiTokenReset).not.toHaveBeenCalled();
  });
  it('reset yang dibatasi tidak membaca token atau melakukan bcrypt', async () => {
    vi.mocked(catatBatasAuth).mockResolvedValueOnce({ boleh: false, tungguDetik: 900 });
    const data = form(); data.set('token', 'a'.repeat(43));
    expect((await resetPassword(undefined, data))?.message).toContain('Terlalu banyak percobaan'); expect(tokenResetMasihBerlaku).not.toHaveBeenCalled(); expect(hashPassword).not.toHaveBeenCalled();
  });
  it('reset gagal limiter DB memberi galat generik sebelum token/hash', async () => {
    vi.mocked(catatBatasAuth).mockRejectedValueOnce(new Error('private database credentials')); const data = form(); data.set('token', 'a'.repeat(43));
    expect((await resetPassword(undefined, data))?.message).toBe('Layanan akun belum tersedia. Coba lagi beberapa saat.'); expect(tokenResetMasihBerlaku).not.toHaveBeenCalled(); expect(hashPassword).not.toHaveBeenCalled();
  });
  it('token yang terpakai setelah precheck tetap ditolak oleh consume atomik', async () => {
    vi.mocked(catatBatasAuth).mockResolvedValueOnce({ boleh: true }); vi.mocked(tokenResetMasihBerlaku).mockResolvedValueOnce(true); vi.mocked(pakaiTokenReset).mockResolvedValueOnce(null);
    const data = form(); data.set('token', 'a'.repeat(43)); expect((await resetPassword(undefined, data))?.message).toContain('Link reset tidak berlaku'); expect(hashPassword).toHaveBeenCalledOnce(); expect(pakaiTokenReset).toHaveBeenCalledOnce(); expect(simpanSesi).not.toHaveBeenCalled();
  });
  it.each([daftar, masuk, lupaPassword])('DB pembatas gagal: respons generik dan tidak menyentuh akun/sesi/email', async action => {
    vi.mocked(catatBatasAuth).mockRejectedValueOnce(new Error('private database credentials'));
    const result = await action(undefined, form());
    expect(result?.message).toBe('Layanan akun belum tersedia. Coba lagi beberapa saat.');
    expect(JSON.stringify(result)).not.toContain('private'); expect(buatAkunPembeli).not.toHaveBeenCalled(); expect(cariAkunUntukMasuk).not.toHaveBeenCalled(); expect(simpanSesi).not.toHaveBeenCalled(); expect(after).not.toHaveBeenCalled();
  });
  it('Vercel menolak header palsu tanpa trusted client IP', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ 'x-real-ip': '6.6.6.6' }) as Awaited<ReturnType<typeof headers>>);
    expect((await masuk(undefined, form()))?.message).toBe('Layanan akun belum tersedia. Coba lagi beberapa saat.');
    expect(catatBatasAuth).not.toHaveBeenCalled(); expect(cariAkunUntukMasuk).not.toHaveBeenCalled();
  });
  it('sukses login membersihkan kunci MySQL sebelum menerbitkan sesi', async () => {
    vi.mocked(catatBatasAuth).mockResolvedValueOnce({ boleh: true }); vi.mocked(hapusBatasAuth).mockResolvedValueOnce();
    vi.mocked(cariAkunUntukMasuk).mockResolvedValueOnce({ id: 1, passwordHash: 'hash', role: 'customer', deletedAt: null });
    await masuk(undefined, form());
    expect(hapusBatasAuth).toHaveBeenCalledWith('masuk:203.0.113.8'); expect(simpanSesi).toHaveBeenCalledOnce();
    expect(vi.mocked(hapusBatasAuth).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(simpanSesi).mock.invocationCallOrder[0]!);
  });
  it('cleanup gagal setelah password cocok: tidak menerbitkan sesi dan tidak membocorkan error', async () => {
    vi.mocked(catatBatasAuth).mockResolvedValueOnce({ boleh: true }); vi.mocked(hapusBatasAuth).mockRejectedValueOnce(new Error('private'));
    vi.mocked(cariAkunUntukMasuk).mockResolvedValueOnce({ id: 1, passwordHash: 'hash', role: 'customer', deletedAt: null });
    expect((await masuk(undefined, form()))?.message).toBe('Layanan akun belum tersedia. Coba lagi beberapa saat.'); expect(simpanSesi).not.toHaveBeenCalled();
  });
});
