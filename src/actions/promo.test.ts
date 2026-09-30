import { describe, it, expect } from 'vitest';
import { cekKodePromo } from './promo';

describe('cekKodePromo (Server Action)', () => {
  it('menolak input kode kosong', async () => {
    const res = await cekKodePromo('', 150000);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('Masukkan kode promo');
    }
  });

  it('menolak validasi jika subtotal <= 0', async () => {
    const res = await cekKodePromo('HEMAT10', 0);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('Keranjang belanja masih kosong');
    }
  });

  it('menolak kode promo yang tidak terdaftar', async () => {
    const res = await cekKodePromo('KODE_PALSU', 200000);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('tidak ditemukan');
    }
  });

  it('menolak kode promo jika subtotal di bawah minimal belanja', async () => {
    // HEMAT10 minSubtotal = 100_000
    const res = await cekKodePromo('hemat10', 50000);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('Minimal belanja');
    }
  });

  it('menerima kode HEMAT10 (persentase) dengan subtotal mencukupi', async () => {
    // 10% dari 200.000 = 20.000 (di bawah max 50.000)
    const res = await cekKodePromo('hemat10', 200000);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.code).toBe('HEMAT10');
      expect(res.discount).toBe(20000);
    }
  });

  it('membatasi potongan HEMAT10 sesuai maxDiscount (50.000)', async () => {
    // 10% dari 800.000 = 80.000 -> dibatasi ke 50.000
    const res = await cekKodePromo('HEMAT10', 800000);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.discount).toBe(50000);
    }
  });

  it('menerima kode ONGKIRFREE (diskon fixed Rp 20.000)', async () => {
    const res = await cekKodePromo('ongkirfree', 160000);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.code).toBe('ONGKIRFREE');
      expect(res.discount).toBe(20000);
    }
  });

  it('menerima kode BELANJA50 (diskon fixed Rp 50.000)', async () => {
    const res = await cekKodePromo('belanja50', 600000);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.code).toBe('BELANJA50');
      expect(res.discount).toBe(50000);
    }
  });
});
