import { Suspense } from 'react';
import HeroBanner from '@/components/product/HeroBanner';
import CategoryList from '@/components/product/CategoryList';
import { ProductSection } from '@/components/product/ProductSection';
import { Skeleton } from '@/components/ui/skeleton';
import { UlasanPilihan } from '@/components/product/UlasanPilihan';
import { JaminanToko, TeksBerjalan } from '@/components/product/TeksBerjalan';
import { ambilBanner, ambilKategori, ambilPilihanBeranda, ambilUlasanBeranda } from '@/lib/data/katalog';

const sections = [
  { key: 'populer', title: 'Terlaris', subtitle: 'Paling banyak dibeli dalam 30 hari terakhir', href: '/produk?urut=populer', count: 8 },
  { key: 'unggulan', title: 'Pilihan kami', href: '/produk', count: 8 },
  { key: 'diskon', title: 'Sedang diskon', subtitle: 'Harga coret untuk produk pilihan', href: '/produk?promo=1', count: 4 },
  { key: 'terbaru', title: 'Baru datang', href: '/produk?urut=terbaru', count: 4 },
] as const;

async function AsyncUlasan() {
  return <UlasanPilihan ulasan={await ambilUlasanBeranda()} />;
}

async function AsyncProductSections({ products }: { products: ReturnType<typeof ambilPilihanBeranda> }) {
  const pilihan = await products;
  return sections.map(({ key, title, href, ...section }) => (
    <ProductSection key={key} title={title} subtitle={'subtitle' in section ? section.subtitle : undefined} href={href} products={pilihan[key]} />
  ));
}

function ProductSectionsSkeleton() {
  return <div aria-busy="true" aria-label="Memuat pilihan produk">
    <p role="status" className="sr-only">Memuat pilihan produk…</p>
    {sections.map(({ key, title, count, ...section }) => <section key={key} className="pt-20 md:pt-28">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div><h2 className="text-4xl font-medium leading-none md:text-6xl">{title}</h2>{'subtitle' in section && <p className="mt-3 text-base text-muted-foreground">{section.subtitle}</p>}</div>
        <Skeleton aria-hidden="true" className="h-11 w-32 shrink-0 rounded-full" />
      </div>
      <div aria-hidden="true" className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
        {Array.from({ length: count }, (_, index) => <div key={index}>
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <Skeleton className="mt-3.5 h-[18px] w-4/5" />
          <Skeleton className="mt-1.5 h-4 w-1/3" />
          <Skeleton className="mt-2 h-5 w-24" />
        </div>)}
      </div>
    </section>)}
  </div>;
}

export default async function Home() {
  const products = ambilPilihanBeranda();
  const [banner, kategori] = await Promise.all([ambilBanner(), ambilKategori()]);
  return <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-3 md:px-6 md:pt-4">
    <HeroBanner slides={banner} />
    <CategoryList categories={kategori} />
    <Suspense fallback={<ProductSectionsSkeleton />}><AsyncProductSections products={products} /></Suspense>
    <Suspense fallback={null}><AsyncUlasan /></Suspense>
    <TeksBerjalan />
    <JaminanToko />
  </main>;
}
