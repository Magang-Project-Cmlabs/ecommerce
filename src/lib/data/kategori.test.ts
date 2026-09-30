import { beforeEach, describe, expect, it, vi } from 'vitest';


const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ prisma: { category: { findMany } } }));

import { ambilPohonKategori } from './kategori';

describe('ambilPohonKategori', () => {
  beforeEach(() => findMany.mockReset());

  it('mengambil field terpilih dengan satu query dan menyusun parent-child menurut sortOrder', async () => {
    findMany.mockResolvedValue([
      { id: 8, name: 'Sub Lambat', slug: 'sub-lambat', image: null, parentId: 2, sortOrder: 8 },
      { id: 4, name: 'Induk B', slug: 'induk-b', image: '/b.webp', parentId: null, sortOrder: 2 },
      { id: 9, name: 'Cucu', slug: 'cucu', image: null, parentId: 8, sortOrder: 1 },
      { id: 7, name: 'Sub Awal', slug: 'sub-awal', image: '/sub.webp', parentId: 2, sortOrder: 1 },
      { id: 2, name: 'Induk A', slug: 'induk-a', image: '/a.webp', parentId: null, sortOrder: 1 },
    ]);

    const hasil = await ambilPohonKategori();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        parentId: true,
        sortOrder: true,
      },
    });
    expect(hasil.map(({ id }) => id)).toEqual([2, 4]);
    expect(hasil[0]).toMatchObject({
      id: 2,
      name: 'Induk A',
      slug: 'induk-a',
      image: '/a.webp',
      parentId: null,
      sortOrder: 1,
      children: [
        { id: 7, parentId: 2, sortOrder: 1, children: [] },
        {
          id: 8,
          parentId: 2,
          sortOrder: 8,
          children: [{ id: 9, parentId: 8, sortOrder: 1, children: [] }],
        },
      ],
    });
  });
});