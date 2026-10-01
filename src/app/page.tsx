import HeroBanner from '@/components/product/HeroBanner';
import CategoryList from '@/components/product/CategoryList';
import { ProductSection } from '@/components/product/ProductSection';
import { ambilBanner, ambilKategori, ambilPilihanBeranda } from '@/lib/data/katalog';
export default async function Home() {
  const [banner, kategori, produk] = await Promise.all([ambilBanner(), ambilKategori(), ambilPilihanBeranda()]);
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5"><HeroBanner slides={banner} /><CategoryList categories={kategori} /><ProductSection title="Produk Terpopuler" subtitle="Terlaris dalam 30 hari terakhir" products={produk.populer} href="/produk?urut=populer" /><ProductSection title="Produk Unggulan" products={produk.unggulan} href="/produk" /><ProductSection title="Penawaran Spesial" subtitle="Harga terbaik untuk produk pilihan" products={produk.diskon} href="/produk?promo=1" /><ProductSection title="Produk Terbaru" products={produk.terbaru} href="/produk?urut=terbaru" /></main>;
}
