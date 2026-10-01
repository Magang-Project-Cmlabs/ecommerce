import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { konfigurasiDb } from '../../../src/lib/konfigurasi-db';
import { loadEnv } from './env';

loadEnv(path.join(__dirname, '..', '..', '..', '.env'));
const database = new URL(process.env.DATABASE_URL || '').pathname;
if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('Uji foto ulasan hanya boleh di database uji terisolasi.');
const db = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });
const [command, email, marker] = process.argv.slice(2);
if (!email || !marker?.startsWith('E2E foto ulasan ')) throw new Error('Penanda uji wajib valid.');

async function run() {
  if (command === 'eligible') {
    return db.orderItem.findFirst({ where: { review: null, product: { isActive: true }, order: { user: { email }, status: 'delivered', deliveredAt: { gte: new Date(Date.now() - 30 * 86400000), lte: new Date() } } }, orderBy: { id: 'asc' }, select: { id: true, product: { select: { slug: true } } } });
  }
  if (command === 'find') {
    const review = await db.review.findFirst({ where: { content: marker, user: { email } }, select: { id: true, images: true, productId: true, orderItemId: true } });
    return review;
  }
  if (command === 'clean') {
    const review = await db.review.findFirst({ where: { content: marker, user: { email } }, select: { id: true, productId: true, images: true } });
    if (!review) return false;
    await db.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: review.id } });
      const stats = await tx.review.aggregate({ where: { productId: review.productId }, _avg: { rating: true }, _count: { id: true } });
      await tx.product.update({ where: { id: review.productId }, data: { rating: Math.round((stats._avg.rating || 0) * 10) / 10, reviewCount: stats._count.id } });
    });
    // Bersihkan hanya file lokal UUID dari ulasan fixture ini, tanpa operasi rekursif.
    const uploadsDirectory = path.resolve(__dirname, '..', '..', '..', 'public', 'uploads');
    for (const image of Array.isArray(review.images) ? review.images : []) {
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
