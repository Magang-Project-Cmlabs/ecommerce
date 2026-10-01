import 'server-only';
import { prisma } from '@/lib/db';
export function ambilProdukCheckout(productIds: number[]) {
  return prisma.product.findMany({ where: { id: { in: productIds } }, include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, variants: { orderBy: { sortOrder: 'asc' } } } });
}
export async function ambilPromoCheckout(code: string, userId: number | null) {
  const [promo, usage] = await Promise.all([prisma.promoCode.findUnique({ where: { code } }), userId ? prisma.promoUsage.count({ where: { code, userId } }) : Promise.resolve(0)]);
  return { promo, usage };
}
