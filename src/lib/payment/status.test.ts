import { describe, expect, it } from 'vitest';
import { tentukanAksi } from './status';
import type { StatusGateway } from './types';

function status(transactionStatus: string, extra: Partial<StatusGateway> = {}): StatusGateway {
  return { idTransaksi: 'INV-202609-0001', transactionStatus, statusCode: '200', jumlah: 150_000, ...extra };
}

describe('tentukanAksi', () => {
  it('settlement berstatus 200 mengonfirmasi pembayaran', () => {
    expect(tentukanAksi(status('settlement', { paymentType: 'bank_transfer' }))).toEqual({
      jenis: 'konfirmasi',
      paymentType: 'bank_transfer',
    });
  });

  it('settlement dengan status_code selain 200 tidak dikonfirmasi', () => {
    expect(tentukanAksi(status('settlement', { statusCode: '201' })).jenis).toBe('abaikan');
  });

  it('capture hanya dikonfirmasi jika fraud_status accept', () => {
    expect(tentukanAksi(status('capture', { fraudStatus: 'accept' })).jenis).toBe('konfirmasi');
    expect(tentukanAksi(status('capture', { fraudStatus: 'challenge' })).jenis).toBe('abaikan');
    expect(tentukanAksi(status('capture', { fraudStatus: 'deny' })).jenis).toBe('abaikan');
    expect(tentukanAksi(status('capture')).jenis).toBe('abaikan');
  });

  it('fraud_status deny pada settlement tidak dikonfirmasi', () => {
    expect(tentukanAksi(status('settlement', { fraudStatus: 'deny' })).jenis).toBe('abaikan');
  });

  it('expire membatalkan pesanan', () => {
    expect(tentukanAksi(status('expire', { statusCode: '407' }))).toEqual({
      jenis: 'batalkan',
      alasan: 'Batas waktu pembayaran habis',
    });
  });

  it.each(['pending', 'authorize', 'deny', 'cancel', 'failure', 'refund', 'partial_refund', 'chargeback'])(
    '%s tidak mengubah status pesanan dan tidak perlu diperiksa',
    (s) => {
      const aksi = tentukanAksi(status(s));
      expect(aksi.jenis).toBe('abaikan');
      expect(aksi).not.toHaveProperty('perluDiperiksa', true);
    },
  );

  it('status tidak dikenal diabaikan tapi ditandai perlu diperiksa', () => {
    expect(tentukanAksi(status('status_baru_tak_dikenal'))).toMatchObject({ jenis: 'abaikan', perluDiperiksa: true });
  });
});
