import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const tx = vi.hoisted(() => ({ $queryRaw: vi.fn().mockResolvedValue([]), order: { findUnique: vi.fn(), updateMany: vi.fn() }, orderStatusLog: { create: vi.fn() } }));
vi.mock('@/lib/db', () => ({ prisma: { $transaction: vi.fn(async work => work(tx)) } }));
vi.mock('./notifikasi', () => ({ kirimNotifikasiPesanan: vi.fn() }));
import { ubahStatus } from './transisi';
import { kirimNotifikasiPesanan } from './notifikasi';
const base = { id: 1, userId: 2, status: 'pending', paymentMethod: 'qris', paymentStatus: 'unpaid', paymentTransactionId: 'INV-202610-0001~2', paymentDueAt: new Date(Date.now() + 86400000), promoCode: null, items: [] };
beforeEach(() => { vi.clearAllMocks(); tx.order.findUnique.mockResolvedValue(base); tx.order.updateMany.mockResolvedValue({ count: 1 }); });
afterEach(() => vi.unstubAllEnvs());
describe('payment attempt checked under transaction lock', () => {
  it('konfirmasi stale attempt ditolak berdasarkan order yang dibaca sesudah row lock', async () => {
    await expect(ubahStatus(1, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: 'INV-202610-0001' })).rejects.toThrow('Percobaan pembayaran');
    expect(tx.$queryRaw).toHaveBeenCalledOnce(); expect(tx.order.updateMany).not.toHaveBeenCalled(); expect(tx.orderStatusLog.create).not.toHaveBeenCalled(); expect(kirimNotifikasiPesanan).not.toHaveBeenCalled();
  });
  it('konfirmasi active attempt menyimpan pembayaran/log dan memberi notifikasi setelah commit', async () => {
    await ubahStatus(1, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: base.paymentTransactionId });
    expect(tx.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'confirmed', paymentStatus: 'paid', paymentTransactionId: base.paymentTransactionId }) })); expect(tx.orderStatusLog.create).toHaveBeenCalledOnce(); expect(kirimNotifikasiPesanan).toHaveBeenCalledOnce();
  });
  it('ID tidak tercatat dan ID kosong tidak boleh mengonfirmasi production walau gatewayVerified true', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('PAYMENT_SIMULATION_ENABLED', 'true');
    tx.order.findUnique.mockResolvedValue({ ...base, paymentTransactionId: null });
    await expect(ubahStatus(1, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: 'INV-202610-0001' })).rejects.toThrow();
    await expect(ubahStatus(1, 'confirmed', 'sistem', { gatewayVerified: true })).rejects.toThrow(); expect(tx.order.updateMany).not.toHaveBeenCalled();
  });
  it('simulasi opt-in lokal tetap hanya untuk pesanan tanpa attempt gateway aktif', async () => {
    vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('PAYMENT_SIMULATION_ENABLED', 'true');
    await expect(ubahStatus(1, 'confirmed', 'sistem', { gatewayVerified: true })).rejects.toThrow();
    tx.order.findUnique.mockResolvedValue({ ...base, paymentTransactionId: null });
    await ubahStatus(1, 'confirmed', 'sistem', { gatewayVerified: true }); expect(tx.order.updateMany).toHaveBeenCalledOnce();
  });
});
