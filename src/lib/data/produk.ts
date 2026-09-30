import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';


const selectProdukCheckout = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  price: true,
  weight: true,
  stock: true,
  isPreorder: true,
  variantLabel: true,
  images: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 1,
    select: { url: true },
  },
  variants: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      productId: true,
      name: true,
      price: true,
      weight: true,
      stock: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.ProductSelect;

type ProdukQuery = Prisma.ProductGetPayload<{ select: typeof selectProdukCheckout }>;

export type ProdukUntukCheckout = Omit<ProdukQuery, 'images' | 'variants'> & {
  image: string | null;
  variants: (ProdukQuery['variants'][number] & {
    effectivePrice: number;
    effectiveWeight: number;
  })[];
};

/** Ambil produk sekaligus; produk arsip dan varian stok nol tetap disertakan untuk pemeriksaan checkout. */
export async function ambilProdukBatch(productIds: readonly number[]): Promise<ProdukUntukCheckout[]> {
  const idsUnik = [...new Set(productIds)];
  if (idsUnik.length === 0) return [];

  const produk = await prisma.product.findMany({
    where: { id: { in: idsUnik } },
    select: selectProdukCheckout,
  });
  const produkById = new Map(produk.map((item) => [item.id, item]));

  return idsUnik.flatMap((id) => {
    const item = produkById.get(id);
    if (!item) return [];

    return [
      {
        id: item.id,
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
        price: item.price,
        weight: item.weight,
        stock: item.stock,
        isPreorder: item.isPreorder,
        variantLabel: item.variantLabel,
        image: item.images[0]?.url ?? null,
        variants: item.variants.map((variant) => ({
          ...variant,
          effectivePrice: variant.price ?? item.price,
          effectiveWeight: variant.weight ?? item.weight,
        })),
      },
    ];
  });
}