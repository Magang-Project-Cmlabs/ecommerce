import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const tx = vi.hoisted(() => ({ $queryRaw: vi.fn().mockResolvedValue([]), order: { findUnique: vi.fn(), updateMany: vi.fn() }, user: { findFirst: vi.fn() }, product: { update: vi.fn(), updateMany: vi.fn() }, productVariant: { update: vi.fn(), groupBy: vi.fn().mockResolvedValue([]) }, promoCode: { updateMany: vi.fn() }, promoUsage: { deleteMany: vi.fn() }, orderStatusLog: { create: vi.fn() } }));
vi.mock('@/lib/db', () => ({ prisma: { $transaction: vi.fn(async work => work(tx)) } }));
vi.mock('./notifikasi', () => ({ kirimNotifikasiPesanan: vi.fn() }));
import { ubahStatus } from './transisi';
const base = { id: 1, userId: 2, status: 'pending', paymentMethod: 'qris', paymentStatus: 'unpaid', paymentDueAt: new Date(Date.now() + 86400000), promoCode: null, items: [{ productId: 1, variantId: null, quantity: 1 }] };
beforeEach(() => { vi.clearAllMocks(); tx.order.findUnique.mockResolvedValue(base); tx.order.updateMany.mockResolvedValue({ count: 1 }); tx.user.findFirst.mockResolvedValue({ id: 2, role: 'customer' }); });
describe('transisi transactional', () => {
  it('owner berbeda ditolak sebelum stok berubah', async () => { await expect(ubahStatus(1, 'cancelled', 'pembeli', { changedById: 9, alasan: 'Batal' })).rejects.toThrow(); expect(tx.product.update).not.toHaveBeenCalled(); });
  it('cron tidak membatalkan sebelum batas pembayaran', async () => { await expect(ubahStatus(1, 'cancelled', 'sistem')).rejects.toThrow(); expect(tx.order.updateMany).not.toHaveBeenCalled(); });
  it('kalah balapan tidak mengembalikan stok/promo', async () => { tx.order.updateMany.mockResolvedValue({ count: 0 }); await expect(ubahStatus(1, 'cancelled', 'pembeli', { changedById: 2, alasan: 'Batal' })).rejects.toThrow(); expect(tx.product.update).not.toHaveBeenCalled(); expect(tx.promoCode.updateMany).not.toHaveBeenCalled(); });
  it('klaim admin dari customer ditolak', async () => { await expect(ubahStatus(1, 'confirmed', 'admin', { changedById: 2 })).rejects.toThrow(); expect(tx.order.updateMany).not.toHaveBeenCalled(); });
});
