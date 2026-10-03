import { describe, it, expect } from 'vitest';
import {
  hitungBeratKg,
  hitungOngkir,
  hitungOpsiPengiriman,
  KOTA_TOKO_DEFAULT,
  TARIF_ZONA,
  type OpsiPengiriman,
} from './ongkir';

const jakarta = { kota: 'Jakarta', provinsi: 'DKI Jakarta' };
const bandung = { kota: 'Bandung', provinsi: 'Jawa Barat' };

describe('hitungBeratKg (PRD §10.3)', () => {
  it('membulatkan berat gram ke atas dalam kg dengan minimal 1 kg', () => {
    expect(hitungBeratKg(0)).toBe(1);
    expect(hitungBeratKg(-500)).toBe(1);
    expect(hitungBeratKg(1)).toBe(1);
    expect(hitungBeratKg(500)).toBe(1);
    expect(hitungBeratKg(1000)).toBe(1);
    expect(hitungBeratKg(1001)).toBe(2);
    expect(hitungBeratKg(2000)).toBe(2);
    expect(hitungBeratKg(2001)).toBe(3);
    expect(hitungBeratKg(20000)).toBe(20);
    expect(hitungBeratKg(20001)).toBe(21);
  });
});

describe('hitungOngkir: tujuan Jawa tetap tarif lama (PRD §10.3 & GLOSSARY)', () => {
  it('menghitung JNE Regular: Rp 15.000 per kg', () => {
    expect(hitungOngkir('jne_reg', 500, bandung)).toBe(15_000);
    expect(hitungOngkir('jne_reg', 1000, jakarta)).toBe(15_000);
    expect(hitungOngkir('jne_reg', 1001, bandung)).toBe(30_000);
    expect(hitungOngkir('jne_reg', 2500, bandung)).toBe(45_000);
  });

  it('menghitung SiCepat REG: Rp 13.000 per kg', () => {
    expect(hitungOngkir('sicepat_reg', 500, bandung)).toBe(13_000);
    expect(hitungOngkir('sicepat_reg', 1000, bandung)).toBe(13_000);
    expect(hitungOngkir('sicepat_reg', 1001, bandung)).toBe(26_000);
    expect(hitungOngkir('sicepat_reg', 2500, bandung)).toBe(39_000);
  });

  it('menghitung GoSend Instant: Rp 30.000 flat untuk pengiriman dalam kota yang memenuhi syarat', () => {
    expect(hitungOngkir('gosend_instant', 500, jakarta, 'Jakarta')).toBe(30_000);
    expect(hitungOngkir('gosend_instant', 20_000, { kota: 'Jakarta Selatan', provinsi: 'DKI Jakarta' }, 'Jakarta')).toBe(30_000);
  });

  it('mengembalikan null bila kurir GoSend tidak memenuhi syarat', () => {
    expect(hitungOngkir('gosend_instant', 1000, bandung, 'Jakarta')).toBeNull();
    expect(hitungOngkir('gosend_instant', 20_001, jakarta, 'Jakarta')).toBeNull();
  });
});

describe('ongkir per zona tujuan (D19)', () => {
  it('tarif per kg berbeda per zona dan per kurir', () => {
    expect(hitungOngkir('jne_reg', 1000, { kota: 'Denpasar', provinsi: 'Bali' })).toBe(TARIF_ZONA.bali_nusra.jne_reg.tarifPerKg);
    expect(hitungOngkir('sicepat_reg', 2500, { kota: 'Medan', provinsi: 'Sumatera Utara' })).toBe(TARIF_ZONA.sumatra.sicepat_reg.tarifPerKg * 3);
    expect(hitungOngkir('jne_reg', 1000, { kota: 'Jayapura', provinsi: 'Papua' })).toBe(TARIF_ZONA.maluku_papua.jne_reg.tarifPerKg);
  });

  it('zona lebih jauh tidak lebih murah dari Jawa', () => {
    for (const zona of Object.keys(TARIF_ZONA) as (keyof typeof TARIF_ZONA)[]) {
      expect(TARIF_ZONA[zona].jne_reg.tarifPerKg).toBeGreaterThanOrEqual(TARIF_ZONA.jawa.jne_reg.tarifPerKg);
      expect(TARIF_ZONA[zona].sicepat_reg.tarifPerKg).toBeGreaterThanOrEqual(TARIF_ZONA.jawa.sicepat_reg.tarifPerKg);
    }
  });

  it('estimasi mengikuti zona', () => {
    const opsi = hitungOpsiPengiriman(1000, { kota: 'Makassar', provinsi: 'Sulawesi Selatan' }, 'Jakarta');
    expect(opsi.find((o) => o.method === 'jne_reg')?.estimate).toBe(TARIF_ZONA.sulawesi.jne_reg.estimate);
  });

  it('penulisan provinsi lama tetap dikenali', () => {
    expect(hitungOngkir('jne_reg', 1000, { kota: 'Surabaya', provinsi: 'jatim' })).toBe(15_000);
  });

  it('provinsi tak dikenal: kurir reguler dinonaktifkan, bukan ditebak', () => {
    const opsi = hitungOpsiPengiriman(1000, { kota: 'Somewhere', provinsi: 'Narnia' }, 'Jakarta');
    for (const kurir of ['jne_reg', 'sicepat_reg'] as const) {
      const o = opsi.find((x) => x.method === kurir)!;
      expect(o.available).toBe(false);
      expect(o.reason).toMatch(/provinsi/i);
    }
    expect(hitungOngkir('jne_reg', 1000, { kota: 'Somewhere', provinsi: 'Narnia' })).toBeNull();
  });
});

describe('hitungOpsiPengiriman (PRD §10.3 & KONTRAK_CHECKOUT §4)', () => {
  it('menghasilkan 3 opsi kurir saat kota sama dan berat <= 20 kg', () => {
    const opsi = hitungOpsiPengiriman(600, jakarta, 'Jakarta');
    expect(opsi).toHaveLength(3);

    expect(opsi.find((o) => o.method === 'jne_reg')).toEqual<OpsiPengiriman>({
      method: 'jne_reg', label: 'JNE Regular', estimate: '2-3 hari', cost: 15_000, available: true, reason: null,
    });
    expect(opsi.find((o) => o.method === 'sicepat_reg')).toEqual<OpsiPengiriman>({
      method: 'sicepat_reg', label: 'SiCepat REG', estimate: '1-2 hari', cost: 13_000, available: true, reason: null,
    });
    expect(opsi.find((o) => o.method === 'gosend_instant')).toEqual<OpsiPengiriman>({
      method: 'gosend_instant', label: 'GoSend Instant', estimate: '1-2 jam', cost: 30_000, available: true, reason: null,
    });
  });

  it('menonaktifkan GoSend jika kota berbeda (tidak peka huruf besar/spasi)', () => {
    const gosend = hitungOpsiPengiriman(1000, { kota: '  bandung  ', provinsi: 'Jawa Barat' }, 'Jakarta').find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(false);
    expect(gosend?.reason).toContain('Jakarta');
  });

  it('mengizinkan GoSend jika kota sama meski variasi huruf besar atau spasi', () => {
    const gosend = hitungOpsiPengiriman(1000, { kota: '  jAkArTa  ', provinsi: 'DKI Jakarta' }, 'Jakarta').find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(true);
    expect(gosend?.reason).toBeNull();
  });

  it('menonaktifkan GoSend jika berat melebihi 20.000 gram (20 kg)', () => {
    const opsi = hitungOpsiPengiriman(20_001, jakarta, 'Jakarta');
    const gosend = opsi.find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(false);
    expect(gosend?.reason).toContain('20 kg');

    const jne = opsi.find((o) => o.method === 'jne_reg');
    expect(jne?.cost).toBe(15_000 * 21);
    expect(jne?.available).toBe(true);
  });

  it('memakai KOTA_TOKO_DEFAULT bila kota toko tidak dioper', () => {
    const gosend = hitungOpsiPengiriman(500, { kota: KOTA_TOKO_DEFAULT, provinsi: 'DKI Jakarta' }).find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(true);
  });
});
