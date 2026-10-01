import { describe, expect, it } from 'vitest';
import { buatPembatas, driverBatasAuth } from './batas-percobaan';

const MENIT = 60_000;

describe('buatPembatas', () => {
  it('production dan Vercel memakai database; development/test memakai memori', () => {
    expect(driverBatasAuth({ NODE_ENV: 'production' })).toBe('database');
    expect(driverBatasAuth({ NODE_ENV: 'test', VERCEL: '1' })).toBe('database');
    expect(driverBatasAuth({ NODE_ENV: 'test' })).toBe('memori');
    expect(driverBatasAuth({ NODE_ENV: 'development', VERCEL: '0' })).toBe('memori');
  });
  it('mengizinkan 5 percobaan, menolak yang ke-6 dengan sisa waktu tunggu', () => {
    let t = 0;
    const batas = buatPembatas({ maks: 5, jendelaMs: 15 * MENIT, jam: () => t });
    for (let i = 0; i < 5; i++) expect(batas.catat('masuk:1.2.3.4').boleh).toBe(true);
    t = 5 * MENIT;
    const ditolak = batas.catat('masuk:1.2.3.4');
    expect(ditolak).toEqual({ boleh: false, tungguDetik: 10 * 60 });
  });

  it('percobaan yang ditolak tidak memperpanjang waktu tunggu', () => {
    let t = 0;
    const batas = buatPembatas({ maks: 1, jendelaMs: 15 * MENIT, jam: () => t });
    batas.catat('k');
    for (t = MENIT; t < 14 * MENIT; t += MENIT) expect(batas.catat('k').boleh).toBe(false);
    t = 15 * MENIT;
    expect(batas.catat('k').boleh).toBe(true);
  });

  it('jendela bergeser: percobaan lama kedaluwarsa satu per satu', () => {
    let t = 0;
    const batas = buatPembatas({ maks: 2, jendelaMs: 10 * MENIT, jam: () => t });
    batas.catat('k'); // t=0
    t = 5 * MENIT;
    batas.catat('k'); // t=5
    t = 9 * MENIT;
    expect(batas.catat('k')).toEqual({ boleh: false, tungguDetik: 60 });
    t = 10 * MENIT; // percobaan t=0 kedaluwarsa, t=5 masih dihitung
    expect(batas.catat('k').boleh).toBe(true);
    expect(batas.catat('k').boleh).toBe(false);
  });

  it('kunci berbeda dihitung terpisah', () => {
    const batas = buatPembatas({ maks: 1, jendelaMs: MENIT, jam: () => 0 });
    expect(batas.catat('masuk:1.1.1.1').boleh).toBe(true);
    expect(batas.catat('masuk:2.2.2.2').boleh).toBe(true);
    expect(batas.catat('lupa:1.1.1.1').boleh).toBe(true);
    expect(batas.catat('masuk:1.1.1.1').boleh).toBe(false);
  });

  it('hapus() mengosongkan hitungan (dipakai setelah masuk berhasil)', () => {
    const batas = buatPembatas({ maks: 1, jendelaMs: MENIT, jam: () => 0 });
    batas.catat('k');
    expect(batas.catat('k').boleh).toBe(false);
    batas.hapus('k');
    expect(batas.catat('k').boleh).toBe(true);
  });

  it('kunci kedaluwarsa dibuang dari memori (tidak tumbuh tanpa batas)', () => {
    let t = 0;
    const batas = buatPembatas({ maks: 5, jendelaMs: MENIT, jam: () => t });
    for (let i = 0; i < 1000; i++) batas.catat(`ip-${i}`);
    t = 2 * MENIT;
    batas.catat('baru');
    expect(batas.ukuran()).toBe(1);
  });
});
