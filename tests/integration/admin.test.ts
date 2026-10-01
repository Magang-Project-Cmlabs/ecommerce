import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
const request = vi.hoisted(() => ({ user: { id: 0, role: 'admin' as 'admin' | 'customer', name: 'Admin Uji', email: 'admin-uji@example.com' } }));
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn(async () => ({ ...request.user })), requireAdmin: vi.fn(async () => ({ ...request.user })) }));
vi.mock('@/lib/data/pengguna', () => ({ ambilPenggunaSaatIni: vi.fn(async () => ({ ...request.user })) }));
vi.mock('@/lib/pesanan/notifikasi', () => ({ kirimNotifikasiPesanan: vi.fn(async () => undefined) }));
import { prisma } from '@/lib/db';
import { simpanProdukAdmin, simpanKategoriAdmin } from '@/actions/admin';
import { buatPesanan } from '@/actions/checkout';
import { ubahStatus } from '@/lib/pesanan/transisi';

const stamp = `admin-${Date.now()}`;
const productIds: number[] = [];
let categoryId = 0; let childId = 0; let adminId = 0; let buyerId = 0; let addressId = 0;
async function product(variant = false, stock = 3) {
  const p = await prisma.product.create({ data: { name: 'Produk Admin Uji', slug: `${stamp}-${productIds.length}`, description: 'Produk asli sebelum perubahan admin.', categoryId, brand: 'TokoKita', price: 89000, weight: 200, specs: {}, tags: [], stock, images: { create: { url: `/uploads/${stamp}.webp` } }, ...(variant ? { variantLabel: 'Ukuran', variants: { create: { name: 'M', stock } } } : {}) }, include: { variants: true, images: true } });
  productIds.push(p.id); return p;
}
type EditProduct = Awaited<ReturnType<typeof product>>;
function editForm(p: EditProduct) {
  const form = new FormData();
  for (const [k, v] of Object.entries({ id: p.id, version: p.updatedAt.toISOString(), name: p.name, slug: p.slug, description: p.description, brand: p.brand, categoryId: p.categoryId, price: p.price, compareAtPrice: '', stock: p.stock, weight: p.weight, variantLabel: p.variantLabel ?? '', specsText: '', tags: '', variants: JSON.stringify(p.variants.map((v) => ({ id: v.id, name: v.name, stock: v.stock, price: v.price, weight: v.weight }))), retainedImages: JSON.stringify(p.images.map((i) => i.url)) })) form.set(k, String(v));
  form.set('isActive', 'on'); return form;
}
function asAdmin() { request.user.id = adminId; request.user.role = 'admin'; }
async function order(p: EditProduct) {
  request.user.id = buyerId; request.user.role = 'customer';
  const result = await buatPesanan({ addressId, shippingMethod: 'jne_reg', paymentMethod: 'cod', items: [{ productId: p.id, variantId: p.variants[0]?.id ?? null, quantity: 1 }] });
  expect(result.ok, JSON.stringify(result)).toBe(true); asAdmin();
  if (!result.ok) throw Error('Pesanan uji gagal'); return result;
}
beforeAll(async () => {
  const database = new URL(process.env.DATABASE_URL!).pathname;
  if (!database.includes('verifikasi') && !database.endsWith('_test')) throw Error('Admin integration tests require isolated database');
  categoryId = (await prisma.category.create({ data: { name: 'Kategori Admin Uji', slug: stamp } })).id;
  childId = (await prisma.category.create({ data: { name: 'Anak Admin Uji', slug: `${stamp}-child`, parentId: categoryId } })).id;
  adminId = (await prisma.user.create({ data: { name: 'Admin Uji', email: `${stamp}@example.com`, passwordHash: 'not-used', role: 'admin' } })).id;
  buyerId = (await prisma.user.create({ data: { name: 'Pembeli Admin Uji', email: `${stamp}-buyer@example.com`, passwordHash: 'not-used' } })).id;
  addressId = (await prisma.address.create({ data: { userId: buyerId, label: 'Rumah', name: 'Pembeli Uji', phone: '081234567890', street: 'Jalan Uji Nomor 1', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820' } })).id;
  asAdmin();
});
afterAll(async () => {
  const orders = await prisma.order.findMany({ where: { userId: buyerId }, select: { id: true } }); const ids = orders.map((o) => o.id);
  await prisma.orderStatusLog.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.order.deleteMany({ where: { id: { in: ids } } });
  await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  if (addressId) await prisma.address.delete({ where: { id: addressId } });
  await prisma.user.deleteMany({ where: { id: { in: [adminId, buyerId] } } });
  if (childId) await prisma.category.delete({ where: { id: childId } });
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
});
describe('MySQL: perubahan admin menjaga stok dan riwayat', () => {
  it('menolak konversi ke varian selama pesanan nonvarian masih dapat dibatalkan, lalu mengizinkan setelah batal', async () => {
    const p = await product(false, 5); const placed = await order(p);
    const current = await prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { variants: true, images: true } });
    const form = editForm(current); form.set('variantLabel', 'Ukuran'); form.set('variants', JSON.stringify([{ id: null, name: 'M', stock: 4, price: null, weight: null }]));
    const result = await simpanProdukAdmin({}, form);
    expect(result.success).not.toBe(true); expect(result.message).toContain('nonvarian');
    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { variants: true } }); expect(unchanged.stock).toBe(4); expect(unchanged.variants).toHaveLength(0);
    const orderRow = await prisma.order.findUniqueOrThrow({ where: { orderNumber: placed.orderNumber } });
    await ubahStatus(orderRow.id, 'cancelled', 'admin', { changedById: adminId, alasan: 'Pembatalan untuk pengujian konversi stok' });
    const restored = await prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { variants: true, images: true } }); expect(restored.stock).toBe(5);
    const conversion = editForm(restored); conversion.set('variantLabel', 'Ukuran'); conversion.set('variants', JSON.stringify([{ id: null, name: 'M', stock: 5, price: null, weight: null }]));
    expect((await simpanProdukAdmin({}, conversion)).success).toBe(true);
    const converted = await prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { variants: true } }); expect(converted.stock).toBe(converted.variants.reduce((sum, v) => sum + v.stock, 0));
  });
  it('form lama tidak mengembalikan stok yang baru dibeli', async () => {
    const p = await product(false, 1); const form = editForm(p); form.set('name', 'Nama baru dari form lama');
    await order(p); const result = await simpanProdukAdmin({}, form);
    expect(result.success).not.toBe(true); expect(result.message).toContain('telah berubah');
    const current = await prisma.product.findUniqueOrThrow({ where: { id: p.id } }); expect(current.stock).toBe(0); expect(current.name).toBe(p.name);
  });
  it('varian yang pernah dipesan tidak bisa dihapus dan transaksi rollback', async () => {
    const p = await product(true); await order(p);
    const current = await prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { variants: true, images: true } }); const form = editForm(current); form.set('variants', '[]'); form.set('stock', '900');
    const result = await simpanProdukAdmin({}, form); expect(result.success).not.toBe(true); expect(result.message).toContain('pernah dipesan');
    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { variants: true } }); expect(unchanged.stock).toBe(2); expect(unchanged.variants).toHaveLength(1);
  });
  it('menolak URL gambar dari produk lain tanpa menyimpan harga baru', async () => {
    const p = await product(); const form = editForm(p); form.set('retainedImages', '["/uploads/foreign.webp"]'); form.set('price', '100');
    expect((await simpanProdukAdmin({}, form)).message).toContain('Gambar');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).price).toBe(89000);
  });
  it('edit harga dan stok varian tetap memakai ID asli dan snapshot pesanan lama', async () => {
    const p = await product(true); await order(p);
    const current = await prisma.product.findUniqueOrThrow({ where: { id: p.id }, include: { variants: true, images: true } }); const form = editForm(current); form.set('price', '99000'); form.set('variants', JSON.stringify([{ id: p.variants[0]!.id, name: 'M', price: null, weight: null, stock: 7 }]));
    expect((await simpanProdukAdmin({}, form)).success).toBe(true);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock).toBe(7);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: p.variants[0]!.id } })).stock).toBe(7);
    expect((await prisma.orderItem.findFirstOrThrow({ where: { productId: p.id } })).price).toBe(89000);
  });
  it('menolak siklus kategori dengan induk menunjuk ke anak', async () => {
    const form = new FormData(); for (const [k, v] of Object.entries({ id: categoryId, name: 'Kategori Admin Uji', slug: stamp, parentId: childId, sortOrder: 0 })) form.set(k, String(v));
    expect((await simpanKategoriAdmin({}, form)).success).not.toBe(true);
    expect((await prisma.category.findUniqueOrThrow({ where: { id: categoryId } })).parentId).toBeNull();
  });
});
