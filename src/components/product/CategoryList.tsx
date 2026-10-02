import Link from 'next/link';
import { Shirt, UserRound, Smartphone, Sofa, SprayCan, Dumbbell, Grid2X2 } from 'lucide-react';
import type { Kategori } from '@/lib/katalog-types';
const icons = { 'fashion-pria': Shirt, 'fashion-wanita': UserRound, elektronik: Smartphone, 'rumah-tangga': Sofa, kecantikan: SprayCan, olahraga: Dumbbell };
export default function CategoryList({ categories }: { categories: Kategori[] }) {
  return <section className="pb-16 pt-12">
    <h2 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] md:text-4xl">Jelajahi kategori</h2>
    <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{categories.filter((k) => k.parentId === null).map((k) => {
      const Icon = icons[k.slug as keyof typeof icons] || Grid2X2;
      return <Link key={k.id} href={`/kategori/${k.slug}`} className="group flex flex-col items-center justify-center gap-3 rounded-3xl bg-tile px-2 py-7 text-center motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-200/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"><Icon aria-hidden className="size-8 text-zinc-800 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110" strokeWidth={1.4} /><span className="text-sm font-medium tracking-[-0.01em]">{k.name}</span></Link>;
    })}</div>
  </section>;
}
