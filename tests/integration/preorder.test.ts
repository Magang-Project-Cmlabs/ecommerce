// Intersection of variant inventory and preorder reservations, using real MySQL.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const request = vi.hoisted(() => ({ id: 0 }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn(async () => ({ id: request.id, role: 'customer' })) }));
vi.mock('@/lib/data/pengguna', () => ({ ambilPenggunaSaatIni: vi.fn(async () => ({ id: request.id })) }));
vi.mock('@/lib/pesanan/notifikasi', () => ({ kirimNotifikasiPesanan: vi.fn() }));
import { prisma } from '@/lib/db';
import { buatPesanan } from '@/actions/checkout';
import { ubahStatus } from '@/lib/pesanan/transisi';
const stamp = Date.now();
let categoryId = 0; let productId = 0;
const users: number[] = []; const addresses: number[] = []; const variants: number[] = [];
const input = (index: number) => ({ addressId: addresses[index]!, shippingMethod: 'jne_reg' as const, paymentMethod: 'bank_bca' as const, items: [{ productId, variantId: variants[index]!, quantity: 1 }] });
beforeAll(async () => {
  const database = new URL(process.env.DATABASE_URL!).pathname;
  if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('Preorder integration requires isolated database');
  categoryId = (await prisma.category.create({ data: { name: 'Kategori Preorder Uji', slug: `preorder-${stamp}` } })).id;
  const product = await prisma.product.create({ data: { name: 'Varian Preorder Uji', slug: `preorder-${stamp}`, categoryId, description: 'Fixture reservasi varian preorder.', brand: 'TokoKita', price: 150000, weight: 100, stock: 0, isPreorder: true, variantLabel: 'Ukuran', specs: {}, tags: [], variants: { create: [{ name: 'M', stock: 0 }, { name: 'L', stock: 0 }] } }, include: { variants: true } });
  productId = product.id; variants.push(...product.variants.map(v => v.id));
  for (let index = 0; index < 2; index++) {
    const user = await prisma.user.create({ data: { name: 'Pembeli Preorder Uji', email: `preorder-${stamp}-${index}@example.test`, passwordHash: 'unused-test-boundary' } }); users.push(user.id);
    addresses.push((await prisma.address.create({ data: { userId: user.id, label: 'Rumah', name: 'Pembeli', phone: '081234567890', street: 'Jalan Preorder Nomor 1', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820' } })).id);
  }
});
afterAll(async () => {
  const orders = await prisma.order.findMany({ where: { userId: { in: users } }, select: { id: true } }); const ids = orders.map(o => o.id);
  await prisma.orderStatusLog.deleteMany({ where: { orderId: { in: ids } } }); await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } }); await prisma.order.deleteMany({ where: { id: { in: ids } } });
  await prisma.address.deleteMany({ where: { userId: { in: users } } }); await prisma.user.deleteMany({ where: { id: { in: users } } });
  if (productId) { await prisma.productVariant.deleteMany({ where: { productId } }); await prisma.product.delete({ where: { id: productId } }); }
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } }); await prisma.$disconnect();
});
describe('MySQL preorder varian tanpa stok semu', () => {
  it('dua varian stok nol dapat preorder, pengubahan flag lalu pembatalan mengembalikan jumlah tepat', async () => {
    request.id = users[0]!; const first = buatPesanan(input(0)); request.id = users[1]!; const second = buatPesanan(input(1));
    const results = await Promise.all([first, second]); expect(results.every(r => r.ok), JSON.stringify(results)).toBe(true);
    let product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true } });
    expect(product.stock).toBe(-2); expect(product.soldCount).toBe(2); expect(product.variants.map(v => v.stock)).toEqual([-1, -1]);
    await prisma.product.update({ where: { id: productId }, data: { isPreorder: false } });
    const orders = await prisma.order.findMany({ where: { userId: { in: users }, items: { some: { productId } } } });
    const cancellations = await Promise.all(orders.map(order => ubahStatus(order.id, 'cancelled', 'pembeli', { changedById: order.userId, alasan: 'Uji reservasi preorder' })));
    expect(cancellations).toHaveLength(2);
    product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true } });
    expect(product.stock).toBe(0); expect(product.soldCount).toBe(0); expect(product.variants.map(v => v.stock)).toEqual([0, 0]);
    request.id = users[0]!; expect((await buatPesanan(input(0))).ok).toBe(false);
    expect(await prisma.orderItem.count({ where: { productId } })).toBe(2);
  });
});
