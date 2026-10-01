import type { MetadataRoute } from 'next';
import { ambilKategori, ambilPetaProduk } from '@/lib/data/katalog';
import { urlAplikasi } from '@/lib/url-aplikasi';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlAplikasi(process.env); const [produk, kategori] = await Promise.all([ambilPetaProduk(), ambilKategori()]);
  return [...['', '/produk', '/bantuan', '/syarat-ketentuan', '/kebijakan-privasi'].map((path) => ({ url: `${base}${path}`, changeFrequency: 'weekly' as const })), ...produk.map((p) => ({ url: `${base}/produk/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const })), ...kategori.map((k) => ({ url: `${base}/kategori/${k.slug}`, changeFrequency: 'weekly' as const }))];
}
