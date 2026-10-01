// Genuine MySQL row locks; gateway/SMTP network calls are not needed here.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/pesanan/notifikasi', () => ({ kirimNotifikasiPesanan: vi.fn() }));
import { prisma } from '@/lib/db';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { kirimNotifikasiPesanan } from '@/lib/pesanan/notifikasi';
const marker = randomBytes(5).toString('hex');
const ids: number[] = [];
let userId = 0;
let categoryId = 0;
let productId = 0;
async function order() {
  const number = `PAY-${marker}-${ids.length}`;
  const value = await prisma.order.create({ data: { orderNumber: number, userId, subtotal: 150000, shippingCost: 15000, grandTotal: 165000, totalWeight: 100, status: 'pending', paymentMethod: 'bank_bca', paymentStatus: 'unpaid', paymentDueAt: new Date(Date.now() + 86400000), shippingMethod: 'jne_reg', shippingAddress: { name: 'Pembeli Uji' }, paymentAttempt: 1, paymentTransactionId: number, items: { create: { productId, name: 'Produk Payment Attempt', price: 150000, quantity: 1, weight: 100 } }, statusLogs: { create: { status: 'pending', note: 'Fixture pending' } } } });
  ids.push(value.id); return value;
}
beforeAll(async () => {
  const name = new URL(process.env.DATABASE_URL!).pathname;
  if (!name.includes('verifikasi') && !name.endsWith('_test')) throw Error('Payment race requires isolated test database');
  userId = (await prisma.user.create({ data: { name: 'Pembeli Payment Attempt', email: `payment-${marker}@example.test`, passwordHash: 'not-used' } })).id;
  categoryId = (await prisma.category.create({ data: { name: 'Kategori Payment Attempt', slug: `payment-${marker}` } })).id;
  productId = (await prisma.product.create({ data: { name: 'Produk Payment Attempt', slug: `payment-${marker}`, categoryId, description: 'Fixture payment.', brand: 'TokoKita', price: 150000, weight: 100, stock: 0, soldCount: 1, specs: {}, tags: [] } })).id;
});
afterAll(async () => {
  await prisma.orderStatusLog.deleteMany({ where: { orderId: { in: ids } } }); await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } }); await prisma.order.deleteMany({ where: { id: { in: ids } } });
  if (productId) await prisma.product.delete({ where: { id: productId } }); if (categoryId) await prisma.category.delete({ where: { id: categoryId } }); if (userId) await prisma.user.delete({ where: { id: userId } }); await prisma.$disconnect();
});
describe('MySQL payment active attempt transaction', () => {
  it('replacement holds row lock while stale settlement starts; stale cannot overwrite newer ID or send notification', async () => {
    const pending = await order(); const snapshot = await prisma.order.findUniqueOrThrow({ where: { id: pending.id } });
    let announce!: () => void; let release!: () => void;
    const locked = new Promise<void>(resolve => { announce = resolve; }); const proceed = new Promise<void>(resolve => { release = resolve; });
    const replacement = prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${pending.id} FOR UPDATE`;
      await tx.order.update({ where: { id: pending.id }, data: { paymentAttempt: 2, paymentTransactionId: `${pending.orderNumber}~2` } }); announce(); await proceed;
    });
    await locked; vi.mocked(kirimNotifikasiPesanan).mockClear();
    const settlement = ubahStatus(pending.id, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: snapshot.paymentTransactionId! });
    const observed = settlement.then(value => ({ ok: true as const, value }), error => ({ ok: false as const, error }));
    try { await new Promise<void>(resolve => setImmediate(resolve)); }
    finally { release(); }
    await replacement;
    const result = await observed; expect(result.ok).toBe(false); if (result.ok) throw Error('Stale settlement accepted'); expect(result.error.message).toContain('Percobaan pembayaran');
    const unchanged = await prisma.order.findUniqueOrThrow({ where: { id: pending.id }, include: { statusLogs: true } });
    expect(unchanged).toMatchObject({ status: 'pending', paymentStatus: 'unpaid', paidAt: null, paymentAttempt: 2, paymentTransactionId: `${pending.orderNumber}~2` }); expect(unchanged.statusLogs).toHaveLength(1); expect(kirimNotifikasiPesanan).not.toHaveBeenCalled();
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(0);
  });
  it('two settlements of the active attempt only one commits paid/log/notification', async () => {
    const pending = await order(); vi.mocked(kirimNotifikasiPesanan).mockClear();
    const results = await Promise.allSettled([ubahStatus(pending.id, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: pending.paymentTransactionId! }), ubahStatus(pending.id, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: pending.paymentTransactionId! })]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const confirmed = await prisma.order.findUniqueOrThrow({ where: { id: pending.id }, include: { statusLogs: true } });
    expect(confirmed).toMatchObject({ status: 'confirmed', paymentStatus: 'paid', paymentTransactionId: pending.paymentTransactionId }); expect(confirmed.paidAt).not.toBeNull(); expect(confirmed.statusLogs).toHaveLength(2); expect(kirimNotifikasiPesanan).toHaveBeenCalledOnce();
  });
});
