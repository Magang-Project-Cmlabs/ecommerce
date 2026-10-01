import Link from 'next/link';
import { Shirt, UserRound, Smartphone, Sofa, SprayCan, Dumbbell, Grid2X2 } from 'lucide-react';
import type { Kategori } from '@/lib/katalog-types';
const icons = { 'fashion-pria': Shirt, 'fashion-wanita': UserRound, elektronik: Smartphone, 'rumah-tangga': Sofa, kecantikan: SprayCan, olahraga: Dumbbell };
export default function CategoryList({ categories }: { categories: Kategori[] }) {
  return <section className="py-8"><h2 className="text-lg font-semibold">Kategori Populer</h2><div className="mt-5 grid grid-cols-3 gap-5 sm:grid-cols-6">{categories.filter((k) => k.parentId === null).map((k) => {
    const Icon = icons[k.slug as keyof typeof icons] || Grid2X2;
    return <Link key={k.id} href={`/kategori/${k.slug}`} className="flex flex-col items-center gap-3 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-20"><Icon className="size-8 sm:size-10" strokeWidth={1.5} /></span><span className="text-sm font-medium">{k.name}</span></Link>;
  })}</div></section>;
}
