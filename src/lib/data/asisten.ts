import 'server-only';
import { createHash } from 'node:crypto';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import type { DataAsisten } from '@/lib/asisten/pengetahuan';
import type { ProdukAksiDb } from '@/lib/asisten/aksi';

const sumberCache = createHash('sha256').update(process.env.DATABASE_URL ?? '').digest('hex');

/** Data PUBLIK untuk asisten: produk aktif, kategori, dan judul banner aktif. Tanpa stok persis, akun, atau kode promo. */
async function bacaDataAsisten(): Promise<DataAsisten> {
  const [produk, kategori, banner] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true }, orderBy: [{ soldCount: 'desc' }, { id: 'asc' }], take: 80,
      select: {
        name: true, slug: true, brand: true, price: true, compareAtPrice: true, stock: true, isPreorder: true, variantLabel: true, rating: true, reviewCount: true, tags: true,
        category: { select: { name: true, parent: { select: { name: true } } } },
        variants: { where: { stock: { gt: 0 } }, orderBy: { id: 'asc' }, select: { name: true } },
      },
    }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { name: true } }),
    prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { title: true, subtitle: true } }),
  ]);
  return {
    produk: produk.map((p) => ({
      name: p.name, slug: p.slug, brand: p.brand, price: p.price, compareAtPrice: p.compareAtPrice, stock: p.stock, isPreorder: p.isPreorder,
      variantLabel: p.variantLabel, varianTersedia: p.variants.map((v) => v.name), rating: Number(p.rating), reviewCount: p.reviewCount,
      kategori: p.category.parent ? `${p.category.parent.name} › ${p.category.name}` : p.category.name,
      tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string').slice(0, 5) : [],
    })),
    kategori: kategori.map((k) => k.name),
    promo: banner.map((b) => (b.subtitle ? `${b.title} (${b.subtitle})` : b.title)),
  };
}

/**
 * Produk aktif untuk kartu aksi dan konteks keranjang asisten (D23). Tidak di-cache: harga dan stok
 * harus segar karena dipakai sebagai harga awal di keranjang (checkout tetap menghitung ulang).
 */
export async function ambilProdukAksi(slugs: string[]): Promise<ProdukAksiDb[]> {
  const unik = [...new Set(slugs)].slice(0, 60);
  if (!unik.length) return [];
  const baris = await prisma.product.findMany({
    where: { slug: { in: unik }, isActive: true },
    select: {
      id: true, slug: true, name: true, price: true, compareAtPrice: true, stock: true, isPreorder: true, variantLabel: true, rating: true, reviewCount: true,
      images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
      variants: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true, name: true, price: true, stock: true } },
    },
  });
  return baris.map(({ images, ...p }) => ({ ...p, rating: Number(p.rating), image: images[0]?.url ?? null }));
}

export const ambilDataAsisten = unstable_cache(bacaDataAsisten, ['tokokita-asisten-v2', sumberCache], { revalidate: 300, tags: ['katalog-publik'] });
