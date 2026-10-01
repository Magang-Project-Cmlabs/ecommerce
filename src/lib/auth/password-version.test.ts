import { describe, expect, it } from 'vitest';
import { versiPassword, versiSesiSah } from './password-version';

const rahasia = 'kunci-uji-acak-sangat-panjang-minimal-32-karakter';
describe('pencabutan sesi setelah perubahan password', () => {
  it('sesi tetap berlaku hanya untuk hash password yang sama', () => {
    const versi = versiPassword('hash-lama', rahasia);
    expect(versiSesiSah(versi, 'hash-lama', rahasia)).toBe(true);
    expect(versiSesiSah(versi, 'hash-baru', rahasia)).toBe(false);
  });
  it('menolak sesi lama tanpa versi dan versi tidak sah', () => {
    expect(versiSesiSah(undefined, 'hash', rahasia)).toBe(false);
    expect(versiSesiSah('versi-palsu', 'hash', rahasia)).toBe(false);
  });
  it('versi tidak memuat hash password dan berubah jika kunci diganti', () => {
    expect(versiPassword('hash', rahasia)).toMatch(/^[a-f0-9]{64}$/);
    expect(versiPassword('hash', rahasia)).not.toEqual(versiPassword('hash', rahasia + '2'));
  });
});
