import type { Metadata } from 'next';
import CatalogPage from '@/components/product/CatalogPage';
import { parseFilterKatalog } from '@/lib/validations/katalog';
export const metadata: Metadata = { title: 'Semua Produk', description: 'Cari dan pilih produk TokoKita berdasarkan kategori, harga, rating, dan merek.', alternates: { canonical: '/produk' } };
export default async function ProdukPage({ searchParams }: PageProps<'/produk'>) {
  const filter = parseFilterKatalog(await searchParams);
  return <CatalogPage title={filter.promo ? 'Penawaran Spesial' : 'Semua Produk'} filter={filter} />;
}
