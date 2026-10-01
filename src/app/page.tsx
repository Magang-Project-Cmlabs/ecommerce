import { Suspense } from 'react';
import HeroBanner from '@/components/product/HeroBanner';
import CategoryList from '@/components/product/CategoryList';
import { ProductSection } from '@/components/product/ProductSection';
import { Skeleton } from '@/components/ui/skeleton';
import { ambilBanner, ambilKategori, ambilPilihanBeranda } from '@/lib/data/katalog';

const sections = [
  { key: 'populer', title: 'Produk Terpopuler', subtitle: 'Terlaris dalam 30 hari terakhir', href: '/produk?urut=populer', count: 8 },
  { key: 'unggulan', title: 'Produk Unggulan', href: '/produk', count: 8 },
  { key: 'diskon', title: 'Penawaran Spesial', subtitle: 'Harga terbaik untuk produk pilihan', href: '/produk?promo=1', count: 4 },
  { key: 'terbaru', title: 'Produk Terbaru', href: '/produk?urut=terbaru', count: 4 },
] as const;

async function AsyncProductSections({ products }: { products: ReturnType<typeof ambilPilihanBeranda> }) {
  const pilihan = await products;
  return sections.map(({ key, title, href, ...section }) => (
    <ProductSection key={key} title={title} subtitle={'subtitle' in section ? section.subtitle : undefined} href={href} products={pilihan[key]} />
  ));
}

function ProductSectionsSkeleton() {
  return <div aria-busy="true" aria-label="Memuat pilihan produk">
    <p role="status" className="sr-only">Memuat pilihan produk…</p>
    {sections.map(({ key, title, count, ...section }) => <section key={key} className="pb-10">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold">{title}</h2>{'subtitle' in section && <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>}</div>
        <Skeleton aria-hidden="true" className="h-11 w-24 shrink-0" />
      </div>
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }, (_, index) => <div key={index} className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
            <Skeleton className="h-4 w-16" />
            <div className="space-y-1"><Skeleton className="h-[18px] w-full" /><Skeleton className="h-[18px] w-3/4" /></div>
            <Skeleton className="h-4 w-24 max-w-full" />
            <Skeleton className="h-7 w-28 max-w-full" />
            <Skeleton className="h-4 w-20" />
            <div className="mt-auto pt-2"><Skeleton className="h-11 w-full rounded-full" /></div>
          </div>
        </div>)}
      </div>
    </section>)}
  </div>;
}

export default async function Home() {
  const products = ambilPilihanBeranda();
  const [banner, kategori] = await Promise.all([ambilBanner(), ambilKategori()]);
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5">
    <HeroBanner slides={banner} />
    <CategoryList categories={kategori} />
    <Suspense fallback={<ProductSectionsSkeleton />}><AsyncProductSections products={products} /></Suspense>
  </main>;
}
