import { describe, expect, it } from 'vitest';
import { parseFilterKatalog, ulasanSchema, wishlistSchema } from './katalog';
describe('isian katalog', () => {
  it('menormalkan URL tak sah tanpa pagination NaN atau query panjang', () => {
    const f = parseFilterKatalog({ q: ' x '.repeat(100), hal: '-1', urut: 'sql', min: 'NaN', rating: '99', tampilan: 'unknown' });
    expect(f.q.length).toBe(100); expect(f.hal).toBe(1); expect(f.urut).toBe('populer'); expect(f.min).toBeUndefined(); expect(f.rating).toBe(5); expect(f.tampilan).toBe('grid');
  });
  it('mempertahankan seluruh filter resmi', () => {
    expect(parseFilterKatalog({ q: [' kaos ', 'diabaikan'], kategori: 'fashion-pria', min: '0', max: '200000', rating: '4', brand: 'Kalemo', urut: 'termurah', hal: '2', tampilan: 'list', promo: '1' })).toEqual({ q: 'kaos', kategori: 'fashion-pria', min: 0, max: 200000, rating: 4, brand: 'Kalemo', urut: 'termurah', hal: 2, tampilan: 'list', promo: true });
  });
  it('membatasi overflow rupiah ke INT', () => expect(parseFilterKatalog({ min: '999999999999' }).min).toBe(2147483647));
  it('filter harga pecahan menjadi INT', () => expect(parseFilterKatalog({ min: '1000.5', max: '2000.8' })).toMatchObject({ min: 1000, max: 2000 }));
});
describe('validasi ulasan', () => {
  const valid = { orderItemId: 1, rating: 5, content: 'Produk bagus dan nyaman.' };
  it('mengizinkan teks10..1000/rating1..5 dan defaults token kosong', () => expect(ulasanSchema.parse(valid).uploadTokens).toEqual([]));
  it.each([0, 6, 1.5])('menolak rating %s', (rating) => expect(ulasanSchema.safeParse({ ...valid, rating }).success).toBe(false));
  it('menolak teks singkat/panjang dan foto lebih3', () => {
    for (const content of ['pendek', 'a'.repeat(1001)]) expect(ulasanSchema.safeParse({ ...valid, content }).success).toBe(false);
    expect(ulasanSchema.safeParse({ ...valid, uploadTokens: Array(4).fill('a.b.c') }).success).toBe(false);
  });
  it('menolak url foto/script eksternal dan path traversal client', () => {
    for (const token of ['javascript:alert(1)', 'https://example.com/foto.jpg', '/uploads/../secret.webp']) expect(ulasanSchema.safeParse({ ...valid, uploadTokens: [token] }).success).toBe(false);
  });
  it('mengizinkan maksimal3 token JWT untuk verifikasi server dan menolak token terlalu panjang', () => {
    expect(ulasanSchema.safeParse({ ...valid, uploadTokens: ['a.b.c', 'd.e.f', 'g.h.i'] }).success).toBe(true);
    expect(ulasanSchema.safeParse({ ...valid, uploadTokens: ['a'.repeat(4097)] }).success).toBe(false);
  });
});
describe('validasi wishlist', () => {
  it('mengharuskan id bilangan positif dan intent boolean', () => {
    expect(wishlistSchema.safeParse({ productId: 1, simpan: true }).success).toBe(true);
    expect(wishlistSchema.safeParse({ productId: -1, simpan: true }).success).toBe(false);
    expect(wishlistSchema.safeParse({ productId: 1, simpan: 'true' }).success).toBe(false);
  });
});
