import Link from 'next/link';
import ProductCard from './ProductCard';
import CatalogFilters from './CatalogFilters';
import CatalogToolbar from './CatalogToolbar';
import { Button } from '@/components/ui/button';
import { ambilBrand, ambilKategori, ambilProdukKatalog } from '@/lib/data/katalog';
import type { FilterKatalog } from '@/lib/katalog-types';

function tautan(filter: FilterKatalog, halaman: number, base: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filter, hal: halaman })) if (value !== undefined && value !== '' && value !== false) query.set(key, key === 'promo' ? '1' : String(value));
  return `${base}?${query}`;
}
export default async function CatalogPage({ title, filter, base = '/produk' }: { title: string; filter: FilterKatalog; base?: string }) {
  const [hasil, kategori, brands] = await Promise.all([ambilProdukKatalog(filter), ambilKategori(), ambilBrand()]);
  return <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 md:px-6 py-8"><nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground"><Link href="/" className="hover:underline">Beranda</Link><span className="mx-2">/</span><span>{title}</span></nav><h1 className="text-4xl font-medium leading-none md:text-5xl">{title}</h1>{filter.q && <p className="mt-2 text-sm text-muted-foreground">Hasil pencarian untuk “{filter.q}”</p>}<div className="mt-6 flex flex-col gap-6 lg:flex-row"><CatalogFilters key={JSON.stringify(filter)} filter={filter} categories={kategori} brands={brands} base={base} /><section className="min-w-0 flex-1" aria-label="Hasil produk"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{hasil.total} produk ditemukan</p><CatalogToolbar filter={filter} base={base} /></div>{hasil.produk.length ? <><div className={filter.tampilan === 'list' ? 'grid gap-4' : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'}>{hasil.produk.map((p, index) => <ProductCard key={p.id} product={p} eager={index === 0} list={filter.tampilan === 'list'} />)}</div>{hasil.halamanTotal > 1 && <nav aria-label="Halaman produk" className="mt-8 flex flex-wrap items-center justify-center gap-2">{hasil.halaman > 1 && <Button asChild variant="outline" className="h-11"><Link href={tautan(filter, hasil.halaman - 1, base)}>Sebelumnya</Link></Button>}{Array.from({ length: hasil.halamanTotal }, (_, i) => i + 1).filter((n) => n === 1 || n === hasil.halamanTotal || Math.abs(n - hasil.halaman) <= 2).map((n) => <Button asChild key={n} variant={n === hasil.halaman ? 'default' : 'outline'} className="size-11"><Link aria-current={n === hasil.halaman ? 'page' : undefined} href={tautan(filter, n, base)}>{n}</Link></Button>)}{hasil.halaman < hasil.halamanTotal && <Button asChild variant="outline" className="h-11"><Link href={tautan(filter, hasil.halaman + 1, base)}>Berikutnya</Link></Button>}</nav>}</> : <div className="rounded-xl border border-dashed px-5 py-16 text-center"><p>Produk tidak ditemukan. Coba kata kunci lain.</p><Button asChild className="mt-5"><Link href="/produk">Lihat Semua Produk</Link></Button></div>}</section></div></main>;
}
