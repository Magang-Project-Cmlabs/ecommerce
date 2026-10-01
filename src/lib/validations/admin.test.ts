import { describe, expect, it } from 'vitest';
import { bannerAdminSchema, kategoriAdminSchema, produkAdminSchema, promoAdminSchema, statusAdminSchema } from './admin';
const product = { id: null, name: 'Kaos katun', slug: 'kaos-katun', description: 'Kaos katun untuk sehari-hari', brand: 'TokoKita', categoryId: 1, price: 89000, compareAtPrice: null, stock: 5, weight: 200, isActive: true, isFeatured: false, isPreorder: false, variantLabel: '', variants: [], specs: {}, tags: [], images: [] };
const promo = { code: 'HEMAT10', description: 'Diskon sepuluh persen', type: 'PERCENT', value: 10, minSubtotal: 100000, maxDiscount: 20000, quota: 10, perUserLimit: 1, startsAt: '2026-10-01', expiresAt: '2026-10-31', isActive: true };
describe('validasi panel admin', () => {
  it('menerima produk lengkap dengan uang dan berat integer', () => expect(produkAdminSchema.safeParse(product).success).toBe(true));
  it('menolak ID nol pada edit produk dan kategori', () => {
    expect(produkAdminSchema.safeParse({ ...product, id: 0 }).success).toBe(false);
    expect(kategoriAdminSchema.safeParse({ id: 0, name: 'Busana', slug: 'busana', parentId: null, sortOrder: 0 }).success).toBe(false);
  });
  it('menolak harga pecahan dan harga coret lebih rendah', () => {
    expect(produkAdminSchema.safeParse({ ...product, price: 89000.1 }).success).toBe(false);
    expect(produkAdminSchema.safeParse({ ...product, compareAtPrice: 88000 }).success).toBe(false);
  });
  it('menolak nama varian duplikat dan varian tanpa label', () => {
    const variant = { id: null, name: 'M', price: null, weight: null, stock: 2 };
    expect(produkAdminSchema.safeParse({ ...product, variants: [variant] }).success).toBe(false);
    expect(produkAdminSchema.safeParse({ ...product, variantLabel: 'Ukuran', variants: [variant, variant] }).success).toBe(false);
  });
  it('menolak lebih dari delapan gambar dan URL gambar duplikat', () => {
    expect(produkAdminSchema.safeParse({ ...product, images: Array.from({ length: 9 }, (_, i) => `/uploads/${i}.webp`) }).success).toBe(false);
    expect(produkAdminSchema.safeParse({ ...product, images: ['/uploads/a.webp', '/uploads/a.webp'] }).success).toBe(false);
  });
  it('menolak promo persen lebih dari 100 dan tanggal terbalik', () => {
    expect(promoAdminSchema.safeParse({ ...promo, value: 101 }).success).toBe(false);
    expect(promoAdminSchema.safeParse({ ...promo, expiresAt: '2026-09-01' }).success).toBe(false);
  });
  it('menolak resi kosong dan pembatalan tanpa alasan', () => {
    expect(statusAdminSchema.safeParse({ orderId: 1, status: 'shipped', trackingNumber: '', alasan: '' }).success).toBe(false);
    expect(statusAdminSchema.safeParse({ orderId: 1, status: 'cancelled', trackingNumber: '', alasan: '' }).success).toBe(false);
  });
  it('menolak tautan banner yang keluar toko dan protocol-relative', () => {
    const banner = { id: null, title: 'Promo', subtitle: '', cta: 'Belanja', sortOrder: 0, isActive: true };
    for (const href of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)']) expect(bannerAdminSchema.safeParse({ ...banner, href }).success).toBe(false);
    expect(bannerAdminSchema.safeParse({ ...banner, href: '/produk?q=kaos' }).success).toBe(true);
  });
});
