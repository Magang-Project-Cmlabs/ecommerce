import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn().mockResolvedValue({ id: 2, role: 'customer' }) }));
vi.mock('@/lib/data/pengguna', () => ({ ambilPenggunaSaatIni: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/db', () => ({ prisma: { $transaction: vi.fn().mockRejectedValue(new Error('offline')), product: { findMany: vi.fn().mockRejectedValue(new Error('offline')) } } }));
import { buatPesanan, pratinjauCheckout, simulasiBayarPesanan } from './checkout';
const valid = { addressId: 1, shippingMethod: 'jne_reg' as const, paymentMethod: 'qris' as const, items: [{ productId: 1, variantId: null, quantity: 1 }] };
describe('checkout gagal aman', () => {
  it('tidak mengaku menyimpan pesanan saat DB gagal', async () => { expect((await buatPesanan(valid)).ok).toBe(false); });
  it('DB pratinjau gagal tanpa produk palsu', async () => { await expect(pratinjauCheckout({ items: valid.items })).rejects.toThrow(); });
  it('input tidak sah ditolak sebelum transaksi', async () => { expect((await buatPesanan({ ...valid, items: [{ productId: 1, variantId: null, quantity: 0 }] })).ok).toBe(false); });
  it('simulasi pembayaran mati secara default', async () => { vi.stubEnv('PAYMENT_SIMULATION_ENABLED', 'false'); expect((await simulasiBayarPesanan('INV-202610-0001')).ok).toBe(false); vi.unstubAllEnvs(); });
});
