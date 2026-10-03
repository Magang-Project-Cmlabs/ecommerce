// Pembersihan file gambar unggahan yang sudah tidak dirujuk data mana pun.
// Dipanggil setelah mutasi admin tersimpan (lewat `after`), jadi kegagalan di
// sini tidak pernah membatalkan simpanan; cukup dicatat tanpa URL lengkap.
import 'server-only';
import { prisma } from '@/lib/db';
import { hapusFileGambar, kunciUnggahan } from '@/lib/storage';

/**
 * URL yang masih dipakai foto produk, kategori, banner, atau riwayat pesanan
 * (`order_items.image` menyalin foto produk saat checkout). Foto ulasan tidak
 * diperiksa: diunggah lewat token khusus ulasan dan tidak pernah dipakai ulang.
 */
export async function urlGambarMasihDipakai(urls: string[]): Promise<Set<string>> {
  if (!urls.length) return new Set();
  const [produk, kategori, banner, pesanan] = await Promise.all([
    prisma.productImage.findMany({ where: { url: { in: urls } }, select: { url: true } }),
    prisma.category.findMany({ where: { image: { in: urls } }, select: { image: true } }),
    prisma.banner.findMany({ where: { image: { in: urls } }, select: { image: true } }),
    prisma.orderItem.findMany({ where: { image: { in: urls } }, select: { image: true }, distinct: ['image'] }),
  ]);
  return new Set([...produk.map((p) => p.url), ...kategori.map((k) => k.image), ...banner.map((b) => b.image), ...pesanan.map((o) => o.image)]
    .filter((url): url is string => !!url));
}

/** Menghapus file unggahan yang tidak lagi dirujuk. Mengembalikan jumlah file terhapus. */
export async function hapusGambarTakTerpakai(urls: Iterable<string | null | undefined>): Promise<number> {
  const kandidat = [...new Set([...urls].filter((url): url is string => !!url && !!kunciUnggahan(url)))];
  if (!kandidat.length) return 0;
  let dipakai: Set<string>;
  try { dipakai = await urlGambarMasihDipakai(kandidat); }
  catch { console.warn('[gambar] Pemeriksaan pemakaian gagal; tidak ada berkas yang dihapus.'); return 0; }
  let terhapus = 0;
  for (const url of kandidat) {
    if (dipakai.has(url)) continue;
    try {
      if (await hapusFileGambar(url)) terhapus++;
      else console.warn('[gambar] Berkas tidak terhapus:', kunciUnggahan(url));
    } catch { console.warn('[gambar] Gagal menghapus berkas:', kunciUnggahan(url)); }
  }
  return terhapus;
}
