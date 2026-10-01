import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ProdukKartu } from '@/lib/katalog-types';
export function ProductSection({ title, subtitle, products, href }: { title: string; subtitle?: string; products: ProdukKartu[]; href: string }) {
  if (!products.length) return null;
  return <section className="muncul pb-12"><div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div><Link href={href} className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-orange-700">Lihat Semua<ChevronRight className="size-4" /></Link></div><div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} belowFold />)}</div></section>;
}
