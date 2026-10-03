import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { kurirBisaDilacak, lacakResi, lacakTersedia, statusKurir } from './lacak';

const sukses = {
  status: 200,
  message: 'Successfully tracked package',
  data: {
    summary: { awb: 'JNE123456789', courier: 'JNE', service: 'REG', status: 'DELIVERED', date: '2026-10-04 09:10:00', desc: 'Diterima oleh: BUDI' },
    history: [
      { date: '2026-10-02 18:00:00', desc: 'SHIPMENT RECEIVED BY JNE COUNTER', location: 'JAKARTA' },
      { date: '2026-10-04 09:10:00', desc: 'DELIVERED TO [BUDI]', location: 'BANDUNG' },
    ],
  },
};
const balas = (isi: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(isi), { status }));

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('lacak resi (Binderbyte, D20)', () => {
  it('status kurir umum diterjemahkan, status lain apa adanya', () => {
    expect(statusKurir('on process')).toBe('Dalam pengiriman');
    expect(statusKurir('DELIVERED')).toBe('Paket sudah diterima');
    expect(statusKurir('WITH COURIER')).toBe('WITH COURIER');
  });

  it('hanya JNE dan SiCepat yang bisa dilacak', () => {
    expect(kurirBisaDilacak('jne_reg')).toBe(true);
    expect(kurirBisaDilacak('sicepat_reg')).toBe(true);
    expect(kurirBisaDilacak('gosend_instant')).toBe(false);
  });

  it('nonaktif tanpa kunci API dan tidak memanggil jaringan', async () => {
    vi.stubEnv('LACAK_RESI_API_KEY', '');
    const ambil = vi.fn();
    expect(lacakTersedia()).toBe(false);
    expect(await lacakResi('jne_reg', 'JNE123456789', ambil)).toEqual({ status: 'tidak-dikonfigurasi' });
    expect(ambil).not.toHaveBeenCalled();
  });

  it('memetakan riwayat terbaru dulu dengan waktu WIB dan ringkasan', async () => {
    vi.stubEnv('LACAK_RESI_API_KEY', 'kunci-uji');
    const ambil = balas(sukses);
    const hasil = await lacakResi('jne_reg', 'JNE123456789', ambil);
    expect(hasil).toEqual({
      status: 'ok',
      ringkasan: { status: 'Paket sudah diterima', keterangan: 'Diterima oleh: BUDI' },
      riwayat: [
        { waktu: '2026-10-04T09:10:00+07:00', keterangan: 'DELIVERED TO [BUDI]', lokasi: 'BANDUNG' },
        { waktu: '2026-10-02T18:00:00+07:00', keterangan: 'SHIPMENT RECEIVED BY JNE COUNTER', lokasi: 'JAKARTA' },
      ],
    });
    const url = new URL(String(ambil.mock.calls[0]![0]));
    expect(url.origin + url.pathname).toBe('https://api.binderbyte.com/v1/track');
    expect(url.searchParams.get('courier')).toBe('jne');
    expect(url.searchParams.get('awb')).toBe('JNE123456789');
  });

  it('resi tidak ditemukan dibedakan dari galat layanan', async () => {
    vi.stubEnv('LACAK_RESI_API_KEY', 'kunci-uji');
    expect(await lacakResi('sicepat_reg', '000111222333', balas({ status: 400, message: 'Data not found' }, 400)))
      .toEqual({ status: 'tidak-ditemukan' });
    expect(await lacakResi('sicepat_reg', '000111222333', balas({ status: 500, message: 'Server error' }, 500))).toEqual({ status: 'gagal' });
    expect(await lacakResi('sicepat_reg', '000111222333', vi.fn().mockRejectedValue(new TypeError('fetch failed')))).toEqual({ status: 'gagal' });
    expect(await lacakResi('sicepat_reg', '000111222333', vi.fn().mockResolvedValue(new Response('bukan json')))).toEqual({ status: 'gagal' });
  });

  it('GoSend dan resi berformat aneh tidak dikirim ke layanan', async () => {
    vi.stubEnv('LACAK_RESI_API_KEY', 'kunci-uji');
    const ambil = vi.fn();
    expect(await lacakResi('gosend_instant', 'GK-212547736', ambil)).toEqual({ status: 'tidak-didukung' });
    expect(await lacakResi('jne_reg', '../../etc', ambil)).toEqual({ status: 'tidak-ditemukan' });
    expect(await lacakResi('jne_reg', 'x'.repeat(60), ambil)).toEqual({ status: 'tidak-ditemukan' });
    expect(ambil).not.toHaveBeenCalled();
  });

  it('tidak mengembalikan kunci API ke pemanggil dan memotong teks panjang', async () => {
    vi.stubEnv('LACAK_RESI_API_KEY', 'kunci-rahasia-uji');
    const panjang = { ...sukses, data: { ...sukses.data, history: [{ date: 'bukan tanggal', desc: 'a'.repeat(1000), location: '' }] } };
    const hasil = await lacakResi('jne_reg', 'JNE123456789', balas(panjang));
    expect(JSON.stringify(hasil)).not.toContain('kunci-rahasia-uji');
    expect(hasil.status === 'ok' && hasil.riwayat[0]).toEqual({ waktu: null, keterangan: 'a'.repeat(300), lokasi: null });
  });
});
