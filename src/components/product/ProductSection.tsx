import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ProdukKartu } from '@/lib/katalog-types';

export function ProductSection({ title, subtitle, products, href }: { title: string; subtitle?: string; products: ProdukKartu[]; href: string }) {
  if (!products.length) return null;
  return <section className="pb-16">
    <div className="mb-6 flex items-end justify-between gap-3">
      <div><h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] md:text-4xl">{title}</h2>{subtitle && <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>}</div>
      <Link href={href} className="flex min-h-11 shrink-0 items-center gap-0.5 text-base font-medium text-orange-700 underline-offset-4 hover:underline">Lihat semua<ChevronRight aria-hidden className="size-4" /></Link>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{products.map((p) => <ProductCard key={p.id} product={p} belowFold />)}</div>
  </section>;
}
