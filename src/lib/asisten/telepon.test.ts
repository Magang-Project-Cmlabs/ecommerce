import { describe, expect, it } from 'vitest';
import { kembalikanTelepon, samarkanTeleponRiwayat } from './telepon';

describe('samarkanTeleponRiwayat', () => {
  it('mengganti nomor HP Indonesia dengan token berurutan; nomor sama memakai token sama', () => {
    const { riwayat, peta } = samarkanTeleponRiwayat([
      { peran: 'pengguna', isi: 'Kirim ke Budi, HP 0812-3456-7890 ya' },
      { peran: 'asisten', isi: 'Baik.' },
      { peran: 'pengguna', isi: 'Atau +62 813 1111 2222, cadangan 081234567890' },
    ]);
    expect(riwayat.map((m) => m.isi)).toEqual(['Kirim ke Budi, HP NOMOR_HP_1 ya', 'Baik.', 'Atau NOMOR_HP_2, cadangan NOMOR_HP_1']);
    expect(peta).toEqual({ NOMOR_HP_1: '081234567890', NOMOR_HP_2: '+6281311112222' });
  });

  it.each(['0812.3456.7890', '(0812) 3456 7890', '0812/3456/7890', '+62 (812) 3456-7890'])('format dengan titik, kurung, atau garis miring ikut disamarkan: %s', (nomor) => {
    const { riwayat, peta } = samarkanTeleponRiwayat([{ peran: 'pengguna', isi: `hp ${nomor} ya` }]);
    expect(riwayat[0]!.isi).toBe('hp NOMOR_HP_1 ya');
    expect(peta.NOMOR_HP_1).toMatch(/^(\+62|0)81234567890$/);
  });

  it('tidak menyentuh angka lain: kode pos, harga, nomor pesanan', () => {
    const isi = 'Kode pos 40132, budget Rp 500.000, pesanan INV-202610-0069';
    expect(samarkanTeleponRiwayat([{ peran: 'pengguna', isi }]).riwayat[0]!.isi).toBe(isi);
  });

  it('pesan asisten tidak disamarkan', () => {
    const isi = 'Hubungi CS di 081200001111';
    expect(samarkanTeleponRiwayat([{ peran: 'asisten', isi }]).riwayat[0]!.isi).toBe(isi);
  });
});

describe('kembalikanTelepon', () => {
  it('token diganti nomor asli; token tak dikenal dikosongkan', () => {
    expect(kembalikanTelepon('NOMOR_HP_1', { NOMOR_HP_1: '081234567890' })).toBe('081234567890');
    expect(kembalikanTelepon('NOMOR_HP_9', { NOMOR_HP_1: '081234567890' })).toBe('');
    expect(kembalikanTelepon('081299998888', {})).toBe('081299998888');
  });
});
