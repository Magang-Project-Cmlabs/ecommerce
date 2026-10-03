import { describe, expect, it } from 'vitest';
import { DAFTAR_PROVINSI, provinsiBaku, zonaProvinsi, kotaSamaDenganToko } from './wilayah';

describe('daftar provinsi', () => {
  it('memuat 38 provinsi tanpa duplikat', () => {
    expect(DAFTAR_PROVINSI).toHaveLength(38);
    expect(new Set(DAFTAR_PROVINSI).size).toBe(38);
  });
  it('setiap provinsi punya zona', () => {
    for (const p of DAFTAR_PROVINSI) expect(zonaProvinsi(p), p).not.toBeNull();
  });
});

describe('provinsiBaku: penulisan lama dan singkatan tetap dikenali', () => {
  it.each([
    ['DKI Jakarta', 'DKI Jakarta'], ['jakarta', 'DKI Jakarta'], ['DKI', 'DKI Jakarta'], ['Daerah Khusus Jakarta', 'DKI Jakarta'],
    ['  jawa   barat ', 'Jawa Barat'], ['Jabar', 'Jawa Barat'], ['Provinsi Jawa Timur', 'Jawa Timur'], ['DIY', 'DI Yogyakarta'],
    ['Daerah Istimewa Yogyakarta', 'DI Yogyakarta'], ['Sumut', 'Sumatera Utara'], ['Sumatra Utara', 'Sumatera Utara'],
    ['NTT', 'Nusa Tenggara Timur'], ['Babel', 'Kepulauan Bangka Belitung'], ['Kepri', 'Kepulauan Riau'], ['Papua Barat Daya', 'Papua Barat Daya'],
  ])('%s → %s', (masuk, baku) => expect(provinsiBaku(masuk)).toBe(baku));
  it('tidak menebak nama yang tidak dikenal', () => {
    expect(provinsiBaku('Narnia')).toBeNull();
    expect(provinsiBaku('')).toBeNull();
  });
});

describe('zona tujuan', () => {
  it.each([
    ['DKI Jakarta', 'jawa'], ['Banten', 'jawa'], ['DI Yogyakarta', 'jawa'], ['Bali', 'bali_nusra'], ['Nusa Tenggara Barat', 'bali_nusra'],
    ['Aceh', 'sumatra'], ['Lampung', 'sumatra'], ['Kalimantan Utara', 'kalimantan'], ['Gorontalo', 'sulawesi'],
    ['Maluku Utara', 'maluku_papua'], ['Papua Pegunungan', 'maluku_papua'], ['jatim', 'jawa'],
  ])('%s → %s', (provinsi, zona) => expect(zonaProvinsi(provinsi)).toBe(zona));
  it('provinsi tak dikenal tidak punya zona', () => expect(zonaProvinsi('Narnia')).toBeNull());
});

describe('kota sama dengan toko (GoSend)', () => {
  it('mengenali kota yang sama dan wilayah administratifnya', () => {
    expect(kotaSamaDenganToko('Jakarta', 'Jakarta')).toBe(true);
    expect(kotaSamaDenganToko('  JAKARTA  selatan', 'Jakarta')).toBe(true);
    expect(kotaSamaDenganToko('Kota Jakarta Timur', 'Jakarta')).toBe(true);
  });
  it('tidak mencocokkan kota lain yang kebetulan berawalan sama', () => {
    expect(kotaSamaDenganToko('Bandung', 'Jakarta')).toBe(false);
    expect(kotaSamaDenganToko('Jakartaku', 'Jakarta')).toBe(false);
    expect(kotaSamaDenganToko('', 'Jakarta')).toBe(false);
  });
});
