import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
const queries = vi.hoisted(() => ({ categories: vi.fn(async () => []), count: vi.fn(), products: vi.fn(), product: vi.fn(), images: vi.fn(), variants: vi.fn(), reviews: vi.fn() }));
vi.mock('@/lib/db', () => ({ prisma: { category: { findMany: queries.categories }, product: { count: queries.count, findMany: queries.products, findFirst: queries.product, fields: { price: 'price' } }, productImage: { findMany: queries.images }, productVariant: { findMany: queries.variants }, review: { findMany: queries.reviews } } }));
import { ambilDetailProduk, ambilProdukKatalog } from './katalog';
import type { FilterKatalog } from '@/lib/katalog-types';
const filter: FilterKatalog = { q: '', kategori: '', brand: '', urut: 'populer', hal: 1, tampilan: 'grid', promo: false };
beforeEach(() => { vi.clearAllMocks(); queries.count.mockReset(); queries.products.mockReset(); queries.products.mockResolvedValue([]); queries.product.mockReset(); queries.images.mockResolvedValue([]); queries.variants.mockResolvedValue([]); queries.reviews.mockResolvedValue([]); });
describe('pagination katalog tanpa waterfall count', () => {
  it('requested-page query starts while count remains pending; normal page reads once', async () => {
    let finish!: (value: number) => void;
    queries.count.mockReturnValueOnce(new Promise<number>(resolve => { finish = resolve; }));
    const pending = ambilProdukKatalog({ ...filter, hal: 2 });
    await vi.waitFor(() => expect(queries.count).toHaveBeenCalledOnce());
    expect(queries.products).toHaveBeenCalledWith(expect.objectContaining({ skip: 24, take: 24 }));
    finish(48); expect(await pending).toMatchObject({ total: 48, halaman: 2, halamanTotal: 2 }); expect(queries.products).toHaveBeenCalledOnce();
  });
  it('out-of-range requests still return the final page, rereading only after clamping', async () => {
    queries.count.mockResolvedValueOnce(30); queries.products.mockResolvedValueOnce([]);
    const finalRows = [{ id: 7, slug: 'produk-uji', name: 'Produk Uji', brand: 'TokoKita', price: 89000, compareAtPrice: null, rating: 4.5, reviewCount: 2, soldCount: 1, stock: 4, isPreorder: false, images: [{ url: '/test.webp' }], _count: { variants: 2 } }];
    queries.products.mockResolvedValueOnce(finalRows);
    const result = await ambilProdukKatalog({ ...filter, hal: 10 });
    expect(queries.products).toHaveBeenNthCalledWith(1, expect.objectContaining({ skip: 216, take: 24 }));
    expect(queries.products).toHaveBeenNthCalledWith(2, expect.objectContaining({ skip: 24, take: 24 }));
    expect(result).toMatchObject({ total: 30, halaman: 2, halamanTotal: 2, produk: [{ id: 7, image: '/test.webp', hasVariants: true }] });
  });
  it('empty catalog keeps halaman1/halamanTotal0 and never fabricates rows', async () => {
    queries.count.mockResolvedValueOnce(0);
    expect(await ambilProdukKatalog(filter)).toEqual({ total: 0, halaman: 1, halamanTotal: 0, produk: [] }); expect(queries.products).toHaveBeenCalledOnce();
  });
});
describe('detail produk dengan relasi paralel', () => {
  it('memulai semua relasi tanpa menunggu scalar; menjaga foto/varian/review/name dan harga/stok fresh', async () => {
    let finish!: (value: unknown) => void;
    queries.product.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const createdAt = new Date('2026-09-20T10:00:00Z');
    queries.images.mockResolvedValueOnce([{ url: '/one.webp' }, { url: '/two.webp' }]);
    queries.variants.mockResolvedValueOnce([{ id: 9, name: 'M', price: null, stock: 4 }]);
    queries.reviews.mockResolvedValueOnce([{ id: 2, rating: 5, content: 'Kualitas bagus sekali.', images: ['/review.webp'], createdAt, user: { name: 'Pembeli' } }]);
    const pending = ambilDetailProduk('produk-uji');
    await vi.waitFor(() => expect(queries.product).toHaveBeenCalledOnce());
    for (const query of [queries.images, queries.variants, queries.reviews]) expect(query).toHaveBeenCalledWith(expect.objectContaining({ where: { product: { slug: 'produk-uji', isActive: true } } }));
    expect(queries.reviews).toHaveBeenCalledWith(expect.objectContaining({ take: 100, orderBy: { createdAt: 'desc' }, select: expect.objectContaining({ user: { select: { name: true } } }) }));
    const scalar = { id: 7, slug: 'produk-uji', name: 'Produk Uji', brand: 'TokoKita', price: 89000, compareAtPrice: null, rating: 4.5, reviewCount: 1, soldCount: 1, stock: 4, isPreorder: false, _count: { variants: 1 }, description: 'Deskripsi produk.', specs: { Bahan: 'Katun' }, variantLabel: 'Ukuran', category: { id: 1, name: 'Fashion', slug: 'fashion', image: null, parentId: null } };
    finish(scalar); const result = await pending;
    expect(result).toMatchObject({ price: 89000, stock: 4, image: '/one.webp', images: ['/one.webp', '/two.webp'], hasVariants: true, variants: [{ id: 9, stock: 4 }], reviews: [{ name: 'Pembeli', content: 'Kualitas bagus sekali.', createdAt: createdAt.toISOString(), images: ['/review.webp'] }] });
    queries.product.mockResolvedValueOnce({ ...scalar, price: 99000, stock: 2 });
    expect(await ambilDetailProduk('produk-uji')).toMatchObject({ price: 99000, stock: 2 });
  });
  it('missing/archived scalar tetap null dan tidak mengembalikan hasil relasi saja', async () => {
    queries.product.mockResolvedValueOnce(null); queries.images.mockResolvedValueOnce([{ url: '/ignored.webp' }]);
    expect(await ambilDetailProduk('missing')).toBeNull();
    expect(queries.product).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'missing', isActive: true } }));
  });
});
