import { describe, expect, it } from 'vitest';
import { LABEL_METODE_PEMBAYARAN, labelMetodePembayaran } from './status';

describe('label metode pembayaran', () => {
  it('memakai label yang sama dengan pilihan checkout', () => {
    expect(labelMetodePembayaran('bank_bca')).toBe('Transfer Bank BCA');
    expect(labelMetodePembayaran('bank_mandiri')).toBe('Transfer Bank Mandiri');
    expect(labelMetodePembayaran('qris')).toBe('QRIS');
    expect(labelMetodePembayaran('cod')).toBe('Bayar di Tempat (COD)');
    expect(Object.keys(LABEL_METODE_PEMBAYARAN)).toEqual(['qris', 'bank_bca', 'bank_mandiri', 'cod']);
  });
  it('kode tak dikenal tetap terbaca tanpa garis bawah', () => {
    expect(labelMetodePembayaran('ewallet_baru')).toBe('ewallet baru');
  });
});
