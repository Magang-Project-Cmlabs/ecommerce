// Dijalankan sebagai proses terpisah oleh helpers/db.ts (lewat tsx), karena
// klien Prisma hasil generate memakai import.meta yang tidak didukung
// transform Playwright. Mencetak satu baris JSON ke stdout.

import path from 'node:path';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { konfigurasiDb } from '../../../src/lib/konfigurasi-db';
import { buatTokenReset } from '../../../src/lib/auth/token-reset';
import { loadEnv } from './env';

loadEnv(path.join(__dirname, '..', '..', '..', '.env'));
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ada di .env');
const db = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });

async function jalankan(perintah: string | undefined, email: string | undefined, arg?: string): Promise<unknown> {
  if (!email) throw new Error('email wajib');
  if (perintah === 'jumlah-token') return db.passwordResetToken.count({ where: { user: { email } } });
  if (perintah === 'pasang-token') {
    const user = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
    const { token, tokenHash } = buatTokenReset();
    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + Number(arg)) } }),
    ]);
    return token;
  }
  if (perintah?.startsWith('admin-')) {
    const database = new URL(process.env.DATABASE_URL!).pathname;
    if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('Fixture admin hanya boleh di database uji terisolasi.');
    if (perintah === 'admin-order-fixture') {
      const user = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
      const category = await db.category.findFirstOrThrow({ select: { id: true } });
      const stamp = String(Date.now());
      const p = await db.product.create({ data: { name: 'Barang Uji Admin', slug: `admin-e2e-${stamp}`, categoryId: category.id, description: 'Barang uji lifecycle admin.', specs: {}, tags: [], brand: 'TokoKita', price: 99000, weight: 200, stock: 2, soldCount: 1, isActive: false } });
      const order = await db.order.create({ data: { userId: user.id, orderNumber: `E2EA${stamp}`, subtotal: 99000, shippingCost: 15000, grandTotal: 114000, totalWeight: 200, paymentMethod: 'bank_bca', shippingMethod: 'jne_reg', paymentDueAt: new Date(Date.now() + 86400000), shippingAddress: { name: 'Penerima Uji', phone: '081234567890', street: 'Jalan Admin 1', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820' }, items: { create: { productId: p.id, name: p.name, price: p.price, weight: p.weight, quantity: 1 } }, statusLogs: { create: { status: 'pending', note: 'Pesanan uji dibuat' } } } });
      return { orderId: order.id, productId: p.id, orderNumber: order.orderNumber };
    }
    if (perintah === 'admin-order-state') {
      const order = await db.order.findUniqueOrThrow({ where: { id: Number(arg) }, include: { statusLogs: true, items: { include: { product: { select: { stock: true } } } } } });
      return { status: order.status, paymentStatus: order.paymentStatus, trackingNumber: order.trackingNumber, logs: order.statusLogs.length, stock: order.items[0]?.product.stock };
    }
    if (perintah === 'admin-clean-fixture') {
      const fixture = JSON.parse(arg ?? '{}') as { orderId: number; productId: number };
      const order = await db.order.findFirst({ where: { id: fixture.orderId, orderNumber: { startsWith: 'E2EA' } }, select: { id: true } });
      if (!order) throw new Error('Fixture admin tidak ditemukan.');
      await db.orderStatusLog.deleteMany({ where: { orderId: order.id } });
      await db.orderItem.deleteMany({ where: { orderId: order.id } });
      await db.order.delete({ where: { id: order.id } });
      await db.product.deleteMany({ where: { id: fixture.productId, slug: { startsWith: 'admin-e2e-' } } });
      return true;
    }
    if (perintah === 'admin-clean-product') {
      if (!arg?.startsWith('admin-e2e-')) throw new Error('Slug produk fixture admin wajib diisi.');
      const product = await db.product.findFirst({ where: { slug: arg, AND: { slug: { startsWith: 'admin-e2e-' } } } });
      if (!product) return false;
      await db.productVariant.deleteMany({ where: { productId: product.id } });
      await db.productImage.deleteMany({ where: { productId: product.id } });
      await db.product.delete({ where: { id: product.id } });
      return true;
    }
    if (perintah === 'admin-clean-content') {
      if (!/^\d{13}$/.test(arg ?? '')) throw new Error('Penanda fixture admin tidak valid.');
      await db.category.deleteMany({ where: { slug: `admin-e2e-kategori-${arg}`, products: { none: {} }, children: { none: {} } } });
      await db.promoCode.deleteMany({ where: { code: `E2E${arg}`, usedCount: 0, usages: { none: {} } } });
      await db.banner.deleteMany({ where: { title: `Banner Admin ${arg}` } });
      return true;
    }
  }
  throw new Error(`perintah tidak dikenal: ${perintah}`);
}

jalankan(process.argv[2], process.argv[3], process.argv[4])
  .then((hasil) => process.stdout.write(JSON.stringify(hasil)))
  .finally(() => db.$disconnect());
