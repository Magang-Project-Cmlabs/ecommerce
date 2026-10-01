import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ find: vi.fn(), usage: vi.fn() }));
vi.mock('@/lib/data/pengguna', () => ({ ambilPenggunaSaatIni: vi.fn().mockResolvedValue({ id: 2 }) }));
vi.mock('@/lib/data/checkout', () => ({ ambilPromoCheckout: vi.fn(async () => ({ promo: await mocks.find(), usage: await mocks.usage() })) }));
import { cekKodePromo } from './promo';
const promo = { code: 'HEMAT10', description: 'Hemat', type: 'PERCENT' as const, value: 10, minSubtotal: 100000, maxDiscount: 50000, isActive: true, startsAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 100000), quota: 10, usedCount: 0, perUserLimit: 1 };
beforeEach(() => { mocks.find.mockResolvedValue(promo); mocks.usage.mockResolvedValue(0); });
describe('kode promo dari DB', () => {
  it('validasi kode dan subtotal sebelum query', async () => { expect((await cekKodePromo('', 100)).ok).toBe(false); expect((await cekKodePromo('HEMAT10', 0)).ok).toBe(false); expect((await cekKodePromo('HEMAT10', NaN)).ok).toBe(false); });
  it('normalisasi kode dan hitungan diskon DB', async () => { expect(await cekKodePromo(' hemat10 ', 600000)).toMatchObject({ ok: true, code: 'HEMAT10', discount: 50000 }); });
  it('batas per-user dicek di pratinjau', async () => { mocks.usage.mockResolvedValue(1); expect((await cekKodePromo('HEMAT10', 200000)).ok).toBe(false); });
  it('promo seed bukan fallback bila DB gagal', async () => { mocks.find.mockRejectedValue(new Error('offline')); expect((await cekKodePromo('HEMAT10', 200000)).ok).toBe(false); });
  it('promo nonaktif tidak disetujui', async () => { mocks.find.mockResolvedValue({ ...promo, isActive: false }); expect((await cekKodePromo('HEMAT10', 200000)).ok).toBe(false); });
  it('input runtime nonstring ditolak tanpa melempar TypeError', async () => { expect(await cekKodePromo(42 as unknown as string, 200000)).toEqual({ ok: false, message: 'Data promo tidak valid.' }); });
});
