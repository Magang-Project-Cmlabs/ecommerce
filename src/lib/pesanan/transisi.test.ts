import { describe, it, expect } from 'vitest';
import { transisiStatusBoleh, LABEL_STATUS_PESANAN, LABEL_STATUS_PEMBAYARAN } from './status';

describe('transisiStatusBoleh (PRD §10.6)', () => {
  it('mengizinkan pembeli membatalkan pesanan yang berstatus pending', () => {
    expect(transisiStatusBoleh('pending', 'cancelled', 'pembeli')).toBe(true);
  });

  it('mengizinkan admin dan sistem membatalkan pesanan pending', () => {
    expect(transisiStatusBoleh('pending', 'cancelled', 'admin')).toBe(true);
    expect(transisiStatusBoleh('pending', 'cancelled', 'sistem')).toBe(true);
  });

  it('mengizinkan sistem atau admin mengonfirmasi pesanan pending setelah bayar', () => {
    expect(transisiStatusBoleh('pending', 'confirmed', 'sistem')).toBe(true);
    expect(transisiStatusBoleh('pending', 'confirmed', 'admin')).toBe(true);
    // Pembeli tidak boleh langsung mengonfirmasi status pending sendiri
    expect(transisiStatusBoleh('pending', 'confirmed', 'pembeli')).toBe(false);
  });

  it('mengizinkan admin memproses confirmed ke packed dan packed ke shipped', () => {
    expect(transisiStatusBoleh('confirmed', 'packed', 'admin')).toBe(true);
    expect(transisiStatusBoleh('packed', 'shipped', 'admin')).toBe(true);
    // Pembeli atau sistem tidak boleh mengubah ke packed atau shipped
    expect(transisiStatusBoleh('confirmed', 'packed', 'pembeli')).toBe(false);
    expect(transisiStatusBoleh('packed', 'shipped', 'pembeli')).toBe(false);
  });

  it('mengizinkan pembeli atau sistem menyelesaikan pesanan shipped ke delivered', () => {
    expect(transisiStatusBoleh('shipped', 'delivered', 'pembeli')).toBe(true);
    expect(transisiStatusBoleh('shipped', 'delivered', 'sistem')).toBe(true);
  });

  it('menolak pembatalan oleh pembeli jika pesanan sudah dikonfirmasi atau dikemas', () => {
    expect(transisiStatusBoleh('confirmed', 'cancelled', 'pembeli')).toBe(false);
    expect(transisiStatusBoleh('packed', 'cancelled', 'pembeli')).toBe(false);
    expect(transisiStatusBoleh('shipped', 'cancelled', 'pembeli')).toBe(false);
  });

  it('menolak transisi dari status terminal (delivered atau cancelled)', () => {
    expect(transisiStatusBoleh('delivered', 'cancelled', 'admin')).toBe(false);
    expect(transisiStatusBoleh('delivered', 'pending', 'sistem')).toBe(false);
    expect(transisiStatusBoleh('cancelled', 'pending', 'admin')).toBe(false);
    expect(transisiStatusBoleh('cancelled', 'confirmed', 'sistem')).toBe(false);
  });

  it('menolak transisi ke status yang sama (no-op)', () => {
    expect(transisiStatusBoleh('pending', 'pending', 'pembeli')).toBe(false);
    expect(transisiStatusBoleh('confirmed', 'confirmed', 'admin')).toBe(false);
  });

  it('memiliki label yang konsisten dengan GLOSSARY.md', () => {
    expect(LABEL_STATUS_PESANAN.pending).toBe('Menunggu Pembayaran');
    expect(LABEL_STATUS_PESANAN.confirmed).toBe('Dikonfirmasi');
    expect(LABEL_STATUS_PESANAN.packed).toBe('Dikemas');
    expect(LABEL_STATUS_PESANAN.shipped).toBe('Dikirim');
    expect(LABEL_STATUS_PESANAN.delivered).toBe('Selesai');
    expect(LABEL_STATUS_PESANAN.cancelled).toBe('Dibatalkan');

    expect(LABEL_STATUS_PEMBAYARAN.unpaid).toBe('Belum Dibayar');
    expect(LABEL_STATUS_PEMBAYARAN.paid).toBe('Lunas');
    expect(LABEL_STATUS_PEMBAYARAN.refunded).toBe('Dikembalikan');
  });
});
