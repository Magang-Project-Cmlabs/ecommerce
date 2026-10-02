import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Kategori } from '@/lib/katalog-types';

// Ubin foto bergaya bento (4 kolom x 2 baris): ubin pertama dan terakhir dua kolom. Label putih di atas
// gradasi gelap supaya terbaca di foto apa pun (terang maupun gelap).
const tata = ['md:col-span-2', '', '', '', '', 'md:col-span-2'];

export default function CategoryList({ categories }: { categories: Kategori[] }) {
  const induk = categories.filter((k) => k.parentId === null && k.image).slice(0, 6);
  if (!induk.length) return null;
  return <section aria-labelledby="judul-kategori" className="pt-20 md:pt-28">
    <div className="flex items-end justify-between gap-4">
      <h2 id="judul-kategori" className="text-4xl font-medium leading-none md:text-6xl">Belanja per kategori</h2>
      <Link href="/produk" className="hidden min-h-11 shrink-0 items-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-foreground/[0.04] sm:inline-flex">Semua produk</Link>
    </div>
    <ul className="mt-8 grid auto-rows-[200px] grid-cols-2 gap-3 md:auto-rows-[320px] md:grid-cols-4 md:gap-4">
      {induk.map((k, i) => <li key={k.id} className={tata[i] ?? ''}>
        <Link href={`/kategori/${k.slug}`} className="group relative block size-full overflow-hidden rounded-3xl bg-tile focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {k.image && <Image src={k.image} alt="" fill quality={50} sizes={tata[i] ? '(max-width: 767px) 50vw, 700px' : '(max-width: 767px) 50vw, 350px'} className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.05]" />}
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.62),transparent_55%)]" />
          <span className={`absolute bottom-4 left-4 right-14 font-heading font-medium leading-tight tracking-[-0.02em] text-white md:bottom-5 md:left-5 ${tata[i] ? 'text-xl md:text-3xl' : 'text-lg md:text-2xl'}`}>{k.name}</span>
          <span aria-hidden className="absolute bottom-3.5 right-3.5 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#0a0a0a] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-45 md:bottom-4 md:right-4"><ArrowUpRight className="size-4" /></span>
        </Link>
      </li>)}
    </ul>
  </section>;
}
