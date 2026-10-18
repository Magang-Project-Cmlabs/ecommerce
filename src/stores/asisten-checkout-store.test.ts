import { describe, expect, it } from 'vitest';
import { perintahSah, UMUR_MAKS_PERINTAH_MS } from './asisten-checkout-store';

const sekarang = 1_800_000_000_000;

describe('perintahSah', () => {
  it('menerima perintah baru dengan kode yang dikenal', () => {
    expect(perintahSah({ id: sekarang - 1000, jenis: 'kurir', kode: 'jne_reg' }, sekarang)).toBe(true);
    expect(perintahSah({ id: sekarang, jenis: 'bayar', kode: 'qris' }, sekarang)).toBe(true);
    expect(perintahSah({ id: sekarang, jenis: 'alamat', data: { name: 'Budi', postalCode: '40132' } }, sekarang)).toBe(true);
  });

  it('menolak perintah kedaluwarsa', () => {
    expect(perintahSah({ id: sekarang - UMUR_MAKS_PERINTAH_MS - 1, jenis: 'bayar', kode: 'cod' }, sekarang)).toBe(false);
  });

  it('menolak isi sessionStorage yang diubah: kode asing, kolom asing, nilai bukan teks', () => {
    expect(perintahSah({ id: sekarang, jenis: 'kurir', kode: '__proto__' }, sekarang)).toBe(false);
    expect(perintahSah({ id: sekarang, jenis: 'bayar', kode: 'kartu_kredit' }, sekarang)).toBe(false);
    expect(perintahSah({ id: sekarang, jenis: 'alamat', data: { userId: '7' } }, sekarang)).toBe(false);
    expect(perintahSah({ id: sekarang, jenis: 'alamat', data: { name: { x: 1 } } }, sekarang)).toBe(false);
    expect(perintahSah({ id: sekarang, jenis: 'hapus' }, sekarang)).toBe(false);
    expect(perintahSah(null, sekarang)).toBe(false);
  });
});
