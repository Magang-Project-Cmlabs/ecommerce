import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ProdukKartu } from '@/lib/katalog-types';

export function ProductSection({ title, subtitle, products, href }: { title: string; subtitle?: string; products: ProdukKartu[]; href: string }) {
  if (!products.length) return null;
  return <section className="pt-20 md:pt-28">
    <div className="mb-8 flex items-end justify-between gap-4">
      <div><h2 className="text-4xl font-medium leading-none md:text-6xl">{title}</h2>{subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}</div>
      <Link href={href} className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-foreground/[0.04]">Lihat semua<ArrowRight aria-hidden className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" /></Link>
    </div>
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} belowFold />)}</div>
  </section>;
}
