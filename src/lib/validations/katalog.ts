import { z } from 'zod';

export const wishlistSchema = z.object({ productId: z.number().int().positive(), simpan: z.boolean() });
export const ulasanSchema = z.object({
  orderItemId: z.coerce.number().int().positive('Pilih produk dari pesanan Anda.'),
  rating: z.coerce.number().int().min(1, 'Pilih rating 1–5.').max(5, 'Pilih rating 1–5.'),
  content: z.string().trim().min(10, 'Ulasan minimal 10 karakter.').max(1000, 'Ulasan maksimal 1000 karakter.'),
  uploadTokens: z.array(z.string().max(4096).regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'Token foto tidak sah.')).max(3, 'Maksimal 3 foto.').default([]),
});

export function parseFilterKatalog(params: Record<string, string | string[] | undefined>) {
  const str = (key: string) => (Array.isArray(params[key]) ? params[key][0] : params[key]) ?? '';
  const angka = (key: string, max: number) => {
    const nilai = Number(str(key));
    return str(key) && Number.isFinite(nilai) && nilai >= 0 ? Math.min(nilai, max) : undefined;
  };
  const urut = str('urut');
  return {
    q: str('q').trim().slice(0, 100), kategori: str('kategori').slice(0, 120),
    min: angka('min', 2_147_483_647) === undefined ? undefined : Math.floor(angka('min', 2_147_483_647)!),
    max: angka('max', 2_147_483_647) === undefined ? undefined : Math.floor(angka('max', 2_147_483_647)!), rating: angka('rating', 5),
    brand: str('brand').slice(0, 100),
    urut: (['termurah', 'termahal', 'terbaru'].includes(urut) ? urut : 'populer') as 'populer' | 'termurah' | 'termahal' | 'terbaru',
    hal: Math.max(1, Math.floor(angka('hal', 100_000) ?? 1)),
    tampilan: str('tampilan') === 'list' ? 'list' as const : 'grid' as const,
    promo: str('promo') === '1',
  };
}
