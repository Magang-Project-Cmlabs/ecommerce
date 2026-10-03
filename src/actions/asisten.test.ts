import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers({ 'x-vercel-forwarded-for': '203.0.113.9' })) }));
vi.mock('@/lib/asisten/pembatas', () => ({ catatBatasAsisten: vi.fn(async () => ({ boleh: true })) }));
vi.mock('@/lib/data/asisten', () => ({ ambilDataAsisten: vi.fn(async () => ({ produk: [], kategori: ['Elektronik'], promo: [] })) }));
vi.mock('@/lib/asisten/penyedia', async (asli) => ({ ...(await asli<typeof import('@/lib/asisten/penyedia')>()), mintaJawaban: vi.fn(async () => ({ ok: true, jawaban: 'Ongkir JNE Rp 15.000 per kg.', model: 'm' })) }));
import { catatBatasAsisten } from '@/lib/asisten/pembatas';
import { mintaJawaban } from '@/lib/asisten/penyedia';
import { tanyaAsisten } from './asisten';

const tanya = (isi: string, sebelumnya: { peran: 'pengguna' | 'asisten'; isi: string }[] = []) => tanyaAsisten({ riwayat: [...sebelumnya, { peran: 'pengguna', isi }] });

beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.stubEnv('VERCEL', '1'); vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('tanyaAsisten', () => {
  it('menjawab memakai instruksi sistem publik dan konfigurasi dari env', async () => {
    expect(await tanya('Berapa ongkir JNE?')).toEqual({ ok: true, jawaban: 'Ongkir JNE Rp 15.000 per kg.' });
    vi.stubEnv('ASISTEN_API_KEY', 'kunci-uji');
    await tanya('Berapa ongkir JNE?');
    const [pesan, konfigurasi] = vi.mocked(mintaJawaban).mock.calls[1]!;
    expect(pesan[0]!.role).toBe('system');
    expect(pesan[0]!.content).toContain('Asisten TokoKita');
    expect(pesan.at(-1)).toEqual({ role: 'user', content: 'Berapa ongkir JNE?' });
    expect(konfigurasi?.kunci).toBe('kunci-uji');
    expect(catatBatasAsisten).toHaveBeenCalledWith('203.0.113.9');
  });

  it('pesan berisi data sensitif ditolak tanpa dikirim ke model', async () => {
    const hasil = await tanya('nomor kartu saya 4111 1111 1111 1111');
    expect(hasil.ok && hasil.jawaban).toMatch(/Demi keamanan/);
    expect(mintaJawaban).not.toHaveBeenCalled();
  });

  it('pesan sensitif lama di riwayat tidak ikut dikirim ulang', async () => {
    await tanya('Ada kaos?', [{ peran: 'pengguna', isi: 'password saya: rahasia123' }, { peran: 'asisten', isi: 'Jangan bagikan password.' }]);
    const [pesan] = vi.mocked(mintaJawaban).mock.calls[0]!;
    expect(JSON.stringify(pesan)).not.toContain('rahasia123');
  });

  it('dibatasi per IP', async () => {
    vi.mocked(catatBatasAsisten).mockResolvedValueOnce({ boleh: false, tungguDetik: 125 });
    expect(await tanya('Halo')).toEqual({ ok: false, pesan: 'Terlalu banyak pertanyaan. Coba lagi dalam 3 menit.' });
    expect(mintaJawaban).not.toHaveBeenCalled();
  });

  it('input tidak sah ditolak', async () => {
    expect((await tanyaAsisten({ riwayat: [] })).ok).toBe(false);
    expect((await tanyaAsisten({ riwayat: [{ peran: 'asisten', isi: 'hai' }] })).ok).toBe(false);
    expect((await tanya('x'.repeat(601))).ok).toBe(false);
    expect((await tanyaAsisten('bukan objek')).ok).toBe(false);
  });

  it('gateway tidak aktif menghasilkan pesan jelas', async () => {
    vi.mocked(mintaJawaban).mockResolvedValueOnce({ ok: false, alasan: 'tidak-aktif' });
    expect(await tanya('Halo')).toEqual({ ok: false, pesan: 'Asisten AI belum aktif di lingkungan ini. Silakan buka Pusat Bantuan.' });
  });
});
