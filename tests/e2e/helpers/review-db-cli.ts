import path from 'node:path';
import { createHash } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { konfigurasiDb } from '../../../src/lib/konfigurasi-db';
import { loadEnv } from './env';

loadEnv(path.join(__dirname, '..', '..', '..', '.env'));
const database = new URL(process.env.DATABASE_URL || '').pathname;
if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('Uji foto ulasan hanya boleh di database uji terisolasi.');
const db = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });
const [command, email, marker, uploadUrls] = process.argv.slice(2);
if (!email || !marker?.startsWith('E2E foto ulasan ')) throw new Error('Penanda uji wajib valid.');
const fixtureId = createHash('sha256').update(marker).digest('hex').slice(0, 16);
const orderNumber = `E2ER${fixtureId}`;
const productSlug = `review-e2e-${fixtureId}`;

async function run() {
  if (command === 'fixture') {
    // Item baru per test: quota unggah sah milik item lain tidak dihapus/diakali.
    return db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
      const category = await tx.category.findFirstOrThrow({ select: { id: true } });
      const product = await tx.product.create({ data: { name: 'Produk Uji Foto Ulasan', slug: productSlug, categoryId: category.id, description: 'Produk fixture terisolasi untuk uji foto ulasan.', specs: {}, tags: [], brand: 'TokoKita', price: 99000, weight: 200, stock: 2, soldCount: 1, isActive: true } });
      const order = await tx.order.create({ data: { userId: user.id, orderNumber, notes: marker, subtotal: 99000, shippingCost: 15000, grandTotal: 114000, totalWeight: 200, paymentMethod: 'bank_bca', paymentStatus: 'paid', status: 'delivered', paidAt: new Date(), deliveredAt: new Date(), shippingMethod: 'jne_reg', shippingAddress: { name: 'Penerima Uji', phone: '081234567890', street: 'Jalan Uji 1', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820' }, items: { create: { productId: product.id, name: product.name, price: product.price, weight: product.weight, quantity: 1 } }, statusLogs: { create: { status: 'delivered', note: 'Fixture ulasan terkirim untuk pengujian.' } } }, select: { items: { select: { id: true } } } });
      return { id: order.items[0]!.id, product: { slug: product.slug } };
    });
  }
  if (command === 'find') {
    const review = await db.review.findFirst({ where: { content: marker, user: { email } }, select: { id: true, images: true, productId: true, orderItemId: true } });
    return review;
  }
  if (command === 'clean') {
    const images = await db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { orderNumber, notes: marker, user: { email } }, select: { id: true, items: { select: { id: true, product: { select: { id: true, slug: true } }, review: { select: { images: true } } } } } });
      if (!order) return [];
      if (order.items.length !== 1 || order.items[0]?.product.slug !== productSlug) throw new Error('Fixture ulasan tidak cocok dengan penanda.');
      const item = order.items[0]!;
      const ownImages = item.review && Array.isArray(item.review.images) ? item.review.images : [];
      await tx.review.deleteMany({ where: { orderItemId: item.id } });
      await tx.orderStatusLog.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.delete({ where: { id: item.id } });
      await tx.order.delete({ where: { id: order.id } });
      await tx.product.delete({ where: { id: item.product.id } });
      return ownImages;
    });
    // Sertakan URL dari response upload fixture bila final submit gagal.
    const uploaded: unknown = JSON.parse(uploadUrls ?? '[]');
    if (!Array.isArray(uploaded)) throw new Error('Daftar unggahan fixture tidak valid.');
    // Bersihkan hanya file lokal UUID dari response/ulasan fixture ini.
    const uploadsDirectory = path.resolve(__dirname, '..', '..', '..', 'public', 'uploads');
    for (const image of new Set([...images, ...uploaded])) {
      if (typeof image !== 'string' || !/^\/uploads\/[0-9a-f-]{36}\.webp$/.test(image)) continue;
      const target = path.resolve(uploadsDirectory, path.basename(image));
      if (!target.startsWith(`${uploadsDirectory}${path.sep}`)) throw new Error('Path unggahan fixture tidak valid.');
      await unlink(target).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; });
    }
    return true;
  }
  throw new Error('Perintah uji tidak dikenali.');
}
run().then((result) => process.stdout.write(JSON.stringify(result))).finally(() => db.$disconnect());
