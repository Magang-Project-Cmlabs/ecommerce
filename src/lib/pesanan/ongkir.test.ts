import { describe, it, expect } from 'vitest';
import {
  hitungBeratKg,
  hitungOngkir,
  hitungOpsiPengiriman,
  KOTA_TOKO_DEFAULT,
  type OpsiPengiriman,
} from './ongkir';

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

describe('hitungOngkir (PRD §10.3 & GLOSSARY)', () => {
  it('menghitung JNE Regular: Rp 15.000 per kg', () => {
    expect(hitungOngkir('jne_reg', 500)).toBe(15_000);
    expect(hitungOngkir('jne_reg', 1000)).toBe(15_000);
    expect(hitungOngkir('jne_reg', 1001)).toBe(30_000);
    expect(hitungOngkir('jne_reg', 2500)).toBe(45_000);
  });

  it('menghitung SiCepat REG: Rp 13.000 per kg', () => {
    expect(hitungOngkir('sicepat_reg', 500)).toBe(13_000);
    expect(hitungOngkir('sicepat_reg', 1000)).toBe(13_000);
    expect(hitungOngkir('sicepat_reg', 1001)).toBe(26_000);
    expect(hitungOngkir('sicepat_reg', 2500)).toBe(39_000);
  });

  it('menghitung GoSend Instant: Rp 30.000 flat untuk pengiriman dalam kota yang memenuhi syarat', () => {
    expect(hitungOngkir('gosend_instant', 500, 'Jakarta', 'Jakarta')).toBe(30_000);
    expect(hitungOngkir('gosend_instant', 20_000, 'Jakarta', 'Jakarta')).toBe(30_000);
  });

  it('mengembalikan null bila kurir GoSend tidak memenuhi syarat', () => {
    expect(hitungOngkir('gosend_instant', 1000, 'Bandung', 'Jakarta')).toBeNull();
    expect(hitungOngkir('gosend_instant', 20_001, 'Jakarta', 'Jakarta')).toBeNull();
  });
});

describe('hitungOpsiPengiriman (PRD §10.3 & KONTRAK_CHECKOUT §4)', () => {
  it('menghasilkan 3 opsi kurir saat kota sama dan berat <= 20 kg', () => {
    const opsi = hitungOpsiPengiriman(600, 'Jakarta', 'Jakarta');
    expect(opsi).toHaveLength(3);

    const jne = opsi.find((o) => o.method === 'jne_reg');
    expect(jne).toEqual<OpsiPengiriman>({
      method: 'jne_reg',
      label: 'JNE Regular',
      estimate: '2-3 hari',
      cost: 15_000,
      available: true,
      reason: null,
    });

    const sicepat = opsi.find((o) => o.method === 'sicepat_reg');
    expect(sicepat).toEqual<OpsiPengiriman>({
      method: 'sicepat_reg',
      label: 'SiCepat REG',
      estimate: '1-2 hari',
      cost: 13_000,
      available: true,
      reason: null,
    });

    const gosend = opsi.find((o) => o.method === 'gosend_instant');
    expect(gosend).toEqual<OpsiPengiriman>({
      method: 'gosend_instant',
      label: 'GoSend Instant',
      estimate: '1-2 jam',
      cost: 30_000,
      available: true,
      reason: null,
    });
  });

  it('menonaktifkan GoSend jika kota berbeda (tidak peka huruf besar/spasi)', () => {
    const opsi = hitungOpsiPengiriman(1000, '  bandung  ', 'Jakarta');
    const gosend = opsi.find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(false);
    expect(gosend?.reason).toContain('Jakarta');
  });

  it('mengizinkan GoSend jika kota sama meski variasi huruf besar atau spasi', () => {
    const opsi = hitungOpsiPengiriman(1000, '  jAkArTa  ', 'Jakarta');
    const gosend = opsi.find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(true);
    expect(gosend?.reason).toBeNull();
  });

  it('menonaktifkan GoSend jika berat melebihi 20.000 gram (20 kg)', () => {
    const opsi = hitungOpsiPengiriman(20_001, 'Jakarta', 'Jakarta');
    const gosend = opsi.find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(false);
    expect(gosend?.reason).toContain('20 kg');

    const jne = opsi.find((o) => o.method === 'jne_reg');
    expect(jne?.cost).toBe(15_000 * 21);
    expect(jne?.available).toBe(true);
  });

  it('memakai KOTA_TOKO_DEFAULT bila kota toko tidak dioper', () => {
    const opsi = hitungOpsiPengiriman(500, KOTA_TOKO_DEFAULT);
    const gosend = opsi.find((o) => o.method === 'gosend_instant');
    expect(gosend?.available).toBe(true);
  });
});

