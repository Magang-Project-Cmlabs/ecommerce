import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';


const selectKategori = {
  id: true,
  name: true,
  slug: true,
  image: true,
  parentId: true,
  sortOrder: true,
} satisfies Prisma.CategorySelect;

type KategoriRow = Prisma.CategoryGetPayload<{ select: typeof selectKategori }>;

export type KategoriPohon = KategoriRow & { children: KategoriPohon[] };

function urutkanKategori(a: KategoriPohon, b: KategoriPohon): number {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}

/** Ambil semua kategori dalam satu query dan susun relasi parent-child di memori. */
export async function ambilPohonKategori(): Promise<KategoriPohon[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: selectKategori,
  });
  const kategoriById = new Map<number, KategoriPohon>();

  for (const row of rows) kategoriById.set(row.id, { ...row, children: [] });

  const roots: KategoriPohon[] = [];
  for (const row of rows) {
    const node = kategoriById.get(row.id)!;
    if (row.parentId === null) {
      roots.push(node);
    } else {
      const parent = kategoriById.get(row.parentId);
      if (parent) parent.children.push(node);
    }
  }

  const urutkanCabang = (nodes: KategoriPohon[]) => {
    nodes.sort(urutkanKategori);
    for (const node of nodes) urutkanCabang(node.children);
  };
  urutkanCabang(roots);

  return roots;
}