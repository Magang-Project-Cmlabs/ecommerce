import { describe, expect, it } from 'vitest';
import { evaluasiPromo } from './promo';
const now = new Date('2026-10-01T00:00:00Z');
const promo = { code: 'HEMAT10', isActive: true, startsAt: new Date('2026-09-01'), expiresAt: new Date('2026-11-01'), quota: 10, usedCount: 9, perUserLimit: 1, minSubtotal: 100000, type: 'PERCENT' as const, value: 10, maxDiscount: 50000 };
describe('promo PRD 10.4', () => {
  it('membatasi persentase lalu subtotal', () => {
    expect(evaluasiPromo(promo, 600000, 0, now)).toEqual({ ok: true, discount: 50000 });
    expect(evaluasiPromo({ ...promo, type: 'FIXED', value: 900000, maxDiscount: null }, 600000, 0, now)).toEqual({ ok: true, discount: 600000 });
  });
  it.each([{ isActive: false }, { startsAt: new Date('2026-10-02') }, { expiresAt: new Date('2026-09-30') }, { usedCount: 10 }])('menolak syarat gagal %j', change => { expect(evaluasiPromo({ ...promo, ...change }, 600000, 0, now).ok).toBe(false); });
  it('menolak batas pengguna dan minimum', () => {
    expect(evaluasiPromo(promo, 600000, 1, now).ok).toBe(false);
    expect(evaluasiPromo(promo, 99999, 0, now).ok).toBe(false);
  });
  it('tanggal awal dan akhir inklusif', () => {
    expect(evaluasiPromo(promo, 100000, 0, promo.startsAt).ok).toBe(true);
    expect(evaluasiPromo(promo, 100000, 0, promo.expiresAt).ok).toBe(true);
  });
});
