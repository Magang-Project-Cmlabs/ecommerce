import 'server-only';
import { cache } from 'react';
import { createHash } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';
import type { FilterKatalog, ProdukKartu, ProdukDetail } from '@/lib/katalog-types';

const kartuSelect = {
  id: true, slug: true, name: true, brand: true, price: true, compareAtPrice: true,
  rating: true, reviewCount: true, soldCount: true, stock: true, isPreorder: true,
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1, select: { url: true } },
  _count: { select: { variants: true } },
} satisfies Prisma.ProductSelect;
type BarisKartu = Prisma.ProductGetPayload<{ select: typeof kartuSelect }>;
function kartu(p: BarisKartu): ProdukKartu {
  const { images, _count, rating, ...produk } = p;
  return { ...produk, rating: Number(rating), image: images[0]?.url ?? null, hasVariants: _count.variants > 0 };
}

// Data publik memakai Data Cache yang kompatibel dengan layout auth dinamis.
// Keputusan transaksi dan data akun tetap dibaca langsung dari database.
const cachePublik = { revalidate: 60, tags: ['katalog-publik'] };
const sumberCache = createHash('sha256').update(process.env.DATABASE_URL ?? '').digest('hex');
export const ambilKategori = cache(unstable_cache(() => prisma.category.findMany({
  orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  select: { id: true, name: true, slug: true, image: true, parentId: true },
}), ['tokokita-kategori-v1', sumberCache], cachePublik));
export const ambilBanner = cache(unstable_cache(() => prisma.banner.findMany({
  where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  select: { id: true, title: true, subtitle: true, image: true, cta: true, href: true },
}), ['tokokita-banner-v1', sumberCache], cachePublik));
export const ambilBrand = cache(async () => (await prisma.product.findMany({
  where: { isActive: true }, select: { brand: true }, distinct: ['brand'], orderBy: { brand: 'asc' },
})).map((p) => p.brand));

export async function ambilProdukKatalog(filter: FilterKatalog) {
  const kategori = await ambilKategori();
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (filter.q) where.OR = [
    { name: { contains: filter.q } }, { brand: { contains: filter.q } }, { description: { contains: filter.q } },
  ];
  if (filter.kategori) {
    const id = kategori.find((k) => k.slug === filter.kategori)?.id;
    const ids = id ? [id] : [];
    for (let index = 0; index < ids.length; index++) {
      ids.push(...kategori.filter((k) => k.parentId === ids[index] && !ids.includes(k.id)).map((k) => k.id));
    }
    where.categoryId = { in: ids };
  }
  if (filter.brand) where.brand = filter.brand;
  if (filter.min !== undefined || filter.max !== undefined) where.price = { gte: filter.min, lte: filter.max };
  if (filter.rating) where.rating = { gte: filter.rating };
  if (filter.promo) where.compareAtPrice = { gt: prisma.product.fields.price };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = filter.urut === 'termurah' ? [{ price: 'asc' }, { id: 'asc' }]
    : filter.urut === 'termahal' ? [{ price: 'desc' }, { id: 'asc' }]
    : filter.urut === 'terbaru' ? [{ createdAt: 'desc' }, { id: 'desc' }]
    : [{ soldCount: 'desc' }, { id: 'asc' }];
  const bacaHalaman = (halaman: number) => prisma.product.findMany({ where, select: kartuSelect, orderBy, skip: (halaman - 1) * 24, take: 24 });
  const [total, requested] = await Promise.all([prisma.product.count({ where }), bacaHalaman(filter.hal)]);
  const halaman = Math.min(filter.hal, Math.max(1, Math.ceil(total / 24)));
  const produk = halaman === filter.hal ? requested : await bacaHalaman(halaman);
  return { produk: produk.map(kartu), total, halaman, halamanTotal: Math.ceil(total / 24) };
}

async function bacaPilihanBeranda() {
  const sejak = new Date(Date.now() - 30 * 86400000);
  const [unggulan, terbaru, diskon, terjual] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, isFeatured: true }, select: kartuSelect, take: 8, orderBy: { soldCount: 'desc' } }),
    prisma.product.findMany({ where: { isActive: true }, select: kartuSelect, take: 4, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
    prisma.product.findMany({ where: { isActive: true, compareAtPrice: { gt: prisma.product.fields.price } }, select: kartuSelect, take: 4, orderBy: { price: 'asc' } }),
    prisma.orderItem.groupBy({ by: ['productId'], where: { order: { createdAt: { gte: sejak }, status: { not: 'cancelled' } }, product: { isActive: true } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 8 }),
  ]);
  const populer = await prisma.product.findMany({ where: { isActive: true, id: { in: terjual.map((p) => p.productId) } }, select: kartuSelect });
  const urutan = new Map(terjual.map((p, i) => [p.productId, i]));
  populer.sort((a, b) => urutan.get(a.id)! - urutan.get(b.id)!);
  return { unggulan: unggulan.map(kartu), terbaru: terbaru.map(kartu), diskon: diskon.map(kartu), populer: populer.map(kartu) };
}
export const ambilPilihanBeranda = unstable_cache(bacaPilihanBeranda, ['tokokita-beranda-v1', sumberCache], cachePublik);

export const ambilDetailProduk = cache(async (slug: string): Promise<ProdukDetail | null> => {
  const where = { slug, isActive: true };
  // The slug is already known, so relation reads need not wait for the scalar
  // query. All data stays fresh; this uses ordinary Prisma queries supported
  // by MySQL and MariaDB without changing transaction load strategies.
  const [scalar, images, variants, reviews] = await Promise.all([
    prisma.product.findFirst({ where, select: { ...kartuSelect, images: false, description: true, specs: true, variantLabel: true,
      category: { select: { id: true, name: true, slug: true, image: true, parentId: true } },
    } }),
    prisma.productImage.findMany({ where: { product: where }, orderBy: { sortOrder: 'asc' }, select: { url: true } }),
    prisma.productVariant.findMany({ where: { product: where }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, stock: true } }),
    prisma.review.findMany({ where: { product: where }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, rating: true, content: true, images: true, createdAt: true, user: { select: { name: true } } } }),
  ]);
  if (!scalar) return null;
  const p = { ...scalar, images, variants, reviews };
  return { ...kartu(p), description: p.description, specs: p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs) ? Object.fromEntries(Object.entries(p.specs).map(([key, value]) => [key, String(value)])) : {},
    category: p.category, variantLabel: p.variantLabel, images: p.images.map((im) => im.url), variants: p.variants,
    reviews: p.reviews.map(({ user, createdAt, images, ...review }) => ({ ...review, name: user.name, createdAt: createdAt.toISOString(), images: Array.isArray(images) ? images.filter((im): im is string => typeof im === 'string') : [] })),
  };
});

export async function cariSaranProduk(q: string) {
  if (q.length < 2) return [];
  return (await prisma.product.findMany({ where: { isActive: true, OR: [{ name: { contains: q } }, { brand: { contains: q } }] }, select: kartuSelect, take: 6, orderBy: [{ soldCount: 'desc' }, { id: 'asc' }] })).map(kartu);
}
export const ambilIdWishlist = cache(async (userId: number) => (await prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true } })).map((w) => w.productId));
export async function ambilWishlist(userId: number) {
  return (await prisma.wishlistItem.findMany({ where: { userId, product: { isActive: true } }, orderBy: { createdAt: 'desc' }, select: { product: { select: kartuSelect } } })).map((w) => kartu(w.product));
}
export async function ambilItemBisaDiulas(userId: number, productId: number) {
  return prisma.orderItem.findMany({ where: { productId, review: null, order: { userId, status: 'delivered', deliveredAt: { gte: new Date(Date.now() - 30 * 86400000), lte: new Date() } } }, select: { id: true, variantName: true, order: { select: { orderNumber: true } } } });
}
export function ambilItemUntukUlasan(orderItemId: number, userId: number) {
  return prisma.orderItem.findFirst({ where: { id: orderItemId, order: { userId } }, include: { order: { select: { userId: true, status: true, deliveredAt: true } }, review: { select: { id: true } } } });
}
export async function ambilPetaProduk() {
  return prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { id: 'asc' } });
}
