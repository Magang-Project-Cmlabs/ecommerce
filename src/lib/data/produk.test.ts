import { beforeEach, describe, expect, it, vi } from 'vitest';


const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ prisma: { product: { findMany } } }));

import { ambilProdukBatch } from './produk';

describe('ambilProdukBatch', () => {
  beforeEach(() => findMany.mockReset());

  it('mengambil beberapa productId dengan satu query dan mengembalikan urutan input', async () => {
    findMany.mockResolvedValue([
      {
        id: 8,
        name: 'Produk Delapan',
        slug: 'produk-delapan',
        isActive: true,
        price: 20000,
        weight: 300,
        stock: 4,
        isPreorder: false,
        variantLabel: null,
        images: [{ url: '/produk-delapan.webp' }],
        variants: [],
      },
      {
        id: 3,
        name: 'Produk Tiga',
        slug: 'produk-tiga',
        isActive: true,
        price: 10000,
        weight: 100,
        stock: 2,
        isPreorder: false,
        variantLabel: null,
        images: [],
        variants: [],
      },
    ]);

    const hasil = await ambilProdukBatch([3, 8, 3]);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [3, 8] } },
        select: expect.objectContaining({
          isActive: true,
          variants: expect.any(Object),
          images: expect.any(Object),
        }),
      }),
    );
    expect(hasil.map((produk) => produk.id)).toEqual([3, 8]);
    expect(hasil[1]?.image).toBe('/produk-delapan.webp');
    expect(hasil[0]?.image).toBeNull();
  });

  it('tetap mengembalikan produk archived dan memuat varian di bawah product induknya', async () => {
    findMany.mockResolvedValue([
      {
        id: 5,
        name: 'Produk Arsip',
        slug: 'produk-arsip',
        isActive: false,
        price: 50000,
        weight: 700,
        stock: 0,
        isPreorder: false,
        variantLabel: 'Ukuran',
        images: [],
        variants: [
          {
            id: 12,
            productId: 5,
            name: 'M',
            price: null,
            weight: null,
            stock: 0,
            sortOrder: 0,
          },
        ],
      },
    ]);

    const [produk] = await ambilProdukBatch([5]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [5] } } }),
    );
    expect(produk?.isActive).toBe(false);
    expect(produk?.variants).toEqual([
      {
        id: 12,
        productId: 5,
        name: 'M',
        price: null,
        weight: null,
        stock: 0,
        sortOrder: 0,
        effectivePrice: 50000,
        effectiveWeight: 700,
      },
    ]);
  });

  it('menggunakan override harga dan berat varian jika tersedia', async () => {
    findMany.mockResolvedValue([
      {
        id: 6,
        name: 'Produk Varian',
        slug: 'produk-varian',
        isActive: true,
        price: 50000,
        weight: 700,
        stock: 3,
        isPreorder: false,
        variantLabel: 'Ukuran',
        images: [],
        variants: [
          {
            id: 19,
            productId: 6,
            name: 'XL',
            price: 65000,
            weight: 900,
            stock: 3,
            sortOrder: 1,
          },
        ],
      },
    ]);

    const [produk] = await ambilProdukBatch([6]);

    expect(produk?.variants[0]).toMatchObject({
      productId: 6,
      effectivePrice: 65000,
      effectiveWeight: 900,
      stock: 3,
    });
  });

  it('tidak menjalankan query ketika daftar productId kosong', async () => {
    await expect(ambilProdukBatch([])).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});