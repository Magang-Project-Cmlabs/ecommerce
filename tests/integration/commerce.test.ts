// Real MySQL transaction tests. Only Next request boundaries are replaced;
// stock, promo, orders and ownership checks use the actual Prisma database.
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
const request = vi.hoisted(() => ({ user: { id: 0, role: 'customer' as 'customer' | 'admin', name: 'Uji', email: 'uji@example.com' } }));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn(async () => ({ ...request.user })), requireAdmin: vi.fn(async () => ({ ...request.user })) }));
vi.mock('@/lib/data/pengguna', () => ({ ambilPenggunaSaatIni: vi.fn(async () => ({ ...request.user })) }));
vi.mock('@/lib/pesanan/notifikasi', () => ({ kirimNotifikasiPesanan: vi.fn(async () => undefined) }));
import { prisma } from '@/lib/db';
import { buatPesanan, pratinjauCheckout } from '@/actions/checkout';
import { batalkanPesanan } from '@/actions/pesanan';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { GET as cron } from '@/app/api/cron/orders/route';

const stamp = `${Date.now()}`;
let categoryId = 0;
const userIds: number[] = [];
const productIds: number[] = [];
const addressIds: number[] = [];
const promoCodes: string[] = [];
function asUser(index: number) { request.user = { id: userIds[index]!, role: index === 2 ? 'admin' : 'customer', name: 'Uji', email: `uji-${index}-${stamp}@example.com` }; }
async function product(stock = 5, isPreorder = false, variant = false) {
  const p = await prisma.product.create({ data: { name: 'Produk Integrasi', slug: `uji-${stamp}-${productIds.length}`, description: 'Produk untuk verifikasi integrasi.', specs: {}, brand: 'TokoKita', tags: [], price: 150000, weight: 1001, categoryId, stock, isPreorder, ...(variant ? { variantLabel: 'Ukuran', variants: { create: { name: 'L', price: 175000, weight: 1000, stock } } } : {}) }, include: { variants: true } });
  productIds.push(p.id); return p;
}
function input(productId: number, userIndex = 0, variantId: number | null = null, promoCode?: string) { return { addressId: addressIds[userIndex]!, shippingMethod: 'jne_reg' as const, paymentMethod: 'bank_bca' as const, items: [{ productId, variantId, quantity: 1 }], ...(promoCode ? { promoCode } : {}) }; }
async function orderFor(productId: number) {
  asUser(0); const result = await buatPesanan(input(productId)); expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) throw Error('Pesanan gagal');
  return prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber }, include: { items: true } });
}
beforeAll(async () => {
  const dbName = new URL(process.env.DATABASE_URL!).pathname;
  if (!dbName.includes('verifikasi') && !dbName.endsWith('_test')) throw Error('Integration tests require an isolated test database');
  categoryId = (await prisma.category.create({ data: { name: 'Kategori Integrasi', slug: `uji-${stamp}` } })).id;
  for (let i = 0; i < 3; i++) {
    const u = await prisma.user.create({ data: { name: 'Pembeli Uji', email: `uji-${i}-${stamp}@example.com`, passwordHash: 'not-used-by-transaction-tests', role: i === 2 ? 'admin' : 'customer' } }); userIds.push(u.id);
    const a = await prisma.address.create({ data: { userId: u.id, label: 'Rumah', name: 'Penerima Uji', phone: '081234567890', street: 'Jalan Uji Nomor 1', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820', isDefault: true } }); addressIds.push(a.id);
  }
});
afterAll(async () => {
  if (userIds.length) {
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true } }); const ids = orders.map(o => o.id);
    await prisma.review.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.orderStatusLog.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.promoUsage.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.promoCode.deleteMany({ where: { code: { in: promoCodes } } });
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});
describe('MySQL: transaksi toko dari awal sampai akhir', () => {
  it('dua pembeli membeli stok terakhir: tepat satu pesanan, stok akhir nol', async () => {
    const p = await product(1); asUser(0); const one = buatPesanan(input(p.id, 0)); asUser(1); const two = buatPesanan(input(p.id, 1));
    const result = await Promise.all([one, two]); expect(result.filter(x => x.ok)).toHaveLength(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(0);
    expect(await prisma.orderItem.count({ where: { productId: p.id } })).toBe(1);
  });
  it('memakai harga/berat server dan menolak alamat milik orang lain', async () => {
    const p = await product(); asUser(0);
    expect((await buatPesanan(input(p.id, 1))).ok).toBe(false);
    const preview = await pratinjauCheckout({ ...input(p.id), shippingMethod: 'jne_reg' }); expect(preview.subtotal).toBe(150000); expect(preview.shippingCost).toBe(30000);
    await prisma.product.update({ where: { id: p.id }, data: { price: 180000 } });
    const order = await orderFor(p.id); expect(order.subtotal).toBe(180000); expect(order.grandTotal).toBe(210000); expect(order.items[0]!.price).toBe(180000);
  });
  it('varian wajib, stok varian berubah, jumlah stok produk tetap sinkron', async () => {
    const p = await product(1, false, true); asUser(0); expect((await buatPesanan(input(p.id))).ok).toBe(false);
    const result = await buatPesanan(input(p.id, 0, p.variants[0]!.id)); expect(result.ok).toBe(true);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: p.variants[0]!.id } })).stock).toBe(0);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(0);
    if (!result.ok) throw Error('Pesanan gagal');
    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } }); expect(order.subtotal).toBe(175000); expect(order.shippingCost).toBe(15000);
    expect((await batalkanPesanan(result.orderNumber, 'Uji pengembalian stok')).ok).toBe(true);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: p.variants[0]!.id } })).stock).toBe(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(1);
  });
  it('promo kuota terakhir aman balapan; dua pembatalan tidak mengembalikan kuota/stok dua kali', async () => {
    const p = await product(10); const code = `UJI${stamp}`; promoCodes.push(code);
    await prisma.promoCode.create({ data: { code, description: 'Uji kuota', type: 'FIXED', value: 20000, minSubtotal: 0, quota: 1, perUserLimit: 1, startsAt: new Date(Date.now() - 60000), expiresAt: new Date(Date.now() + 86400000) } });
    asUser(0); const one = buatPesanan(input(p.id, 0, null, code)); asUser(1); const two = buatPesanan(input(p.id, 1, null, code)); const results = await Promise.all([one, two]); expect(results.filter(r => r.ok)).toHaveLength(1);
    const result = results.find(r => r.ok)!; if (!result.ok) throw Error('Pesanan gagal'); const o = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    const cancel = await Promise.allSettled([ubahStatus(o.id, 'cancelled', 'pembeli', { changedById: o.userId, alasan: 'Batal' }), ubahStatus(o.id, 'cancelled', 'pembeli', { changedById: o.userId, alasan: 'Batal' })]); expect(cancel.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(10);
    expect((await prisma.promoCode.findUniqueOrThrow({ where: { code } })).usedCount).toBe(0); expect(await prisma.promoUsage.count({ where: { code } })).toBe(0);
  });
  it('menolak pembeli/admin palsu, mewajibkan resi, lalu menyelesaikan COD dengan log lengkap', async () => {
    const p = await product(); asUser(0); const result = await buatPesanan({ ...input(p.id), paymentMethod: 'cod' }); if (!result.ok) throw Error(JSON.stringify(result));
    const o = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } }); expect(o.status).toBe('confirmed'); expect(o.paymentStatus).toBe('unpaid');
    await expect(ubahStatus(o.id, 'packed', 'admin', { changedById: userIds[0]! })).rejects.toThrow();
    await ubahStatus(o.id, 'packed', 'admin', { changedById: userIds[2]! });
    await expect(ubahStatus(o.id, 'shipped', 'admin', { changedById: userIds[2]! })).rejects.toThrow();
    await ubahStatus(o.id, 'shipped', 'admin', { changedById: userIds[2]!, trackingNumber: 'RESI-UJI-123' });
    await expect(ubahStatus(o.id, 'delivered', 'pembeli', { changedById: userIds[1]! })).rejects.toThrow();
    await ubahStatus(o.id, 'delivered', 'pembeli', { changedById: userIds[0]! });
    const finished = await prisma.order.findUniqueOrThrow({ where: { id: o.id }, include: { statusLogs: true } }); expect(finished.paymentStatus).toBe('paid'); expect(finished.statusLogs).toHaveLength(4);
  });
  it('cron dijaga rahasia, memeriksa jatuh tempo, dan aman dijalankan ulang', async () => {
    vi.stubEnv('CRON_SECRET', 'rahasia-cron-uji-terisolasi');
    const p = await product(); const o = await orderFor(p.id);
    await expect(ubahStatus(o.id, 'cancelled', 'sistem', { alasan: 'Belum lewat batas' })).rejects.toThrow();
    expect((await cron(new Request('http://localhost/api/cron/orders') as never)).status).toBe(401);
    await prisma.order.update({ where: { id: o.id }, data: { paymentDueAt: new Date(Date.now() - 60000) } });
    const req = () => new Request('http://localhost/api/cron/orders', { headers: { Authorization: 'Bearer rahasia-cron-uji-terisolasi' } }) as never;
    expect((await cron(req())).status).toBe(200); expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe('cancelled');
    const stock = (await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock; await cron(req()); expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(stock);
    vi.unstubAllEnvs();
  });
  it('pre-order stok nol dapat dipesan dan dikembalikan tepat saat batal', async () => {
    const p = await product(0, true); const o = await orderFor(p.id); expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(-1);
    await ubahStatus(o.id, 'cancelled', 'pembeli', { changedById: userIds[0]!, alasan: 'Batal pre-order' }); expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(0);
  });
});
