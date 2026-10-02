import Link from 'next/link';
import { BadgeCheck, Star } from 'lucide-react';
import type { UlasanBeranda } from '@/lib/beranda';

function Bintang({ rating, besar = false }: { rating: number; besar?: boolean }) {
  return <div className="flex items-center gap-0.5" role="img" aria-label={`Rating ${rating} dari 5`}>
    {Array.from({ length: 5 }, (_, i) => <Star key={i} aria-hidden className={`${besar ? 'size-5' : 'size-4'} ${i < rating ? 'fill-foreground text-foreground' : 'text-foreground/25'}`} />)}
  </div>;
}

/** Ulasan terverifikasi nyata dari pembeli (bukan testimoni karangan). Kosong -> bagian disembunyikan. */
export function UlasanPilihan({ ulasan }: { ulasan: UlasanBeranda[] }) {
  const [utama, ...lain] = ulasan;
  if (!utama) return null;
  return <section aria-labelledby="judul-ulasan" className="pt-24 md:pt-36">
    <h2 id="judul-ulasan" className="sr-only">Kata pembeli</h2>
    <figure className="mx-auto max-w-4xl text-center">
      <div className="flex justify-center"><Bintang rating={utama.rating} besar /></div>
      <blockquote className="mt-7 text-balance font-heading text-3xl font-medium leading-[1.12] tracking-[-0.03em] md:text-5xl">“{utama.isi}”</blockquote>
      <figcaption className="mt-7 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">{utama.nama}<BadgeCheck aria-label="Pembeli terverifikasi" className="size-4 text-foreground/70" /></span>
        <span className="text-muted-foreground"> · membeli </span>
        <Link href={`/produk/${utama.slug}#ulasan-produk`} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">{utama.produk}</Link>
      </figcaption>
    </figure>
    {lain.length > 0 && <ul className="mt-16 grid gap-3 md:grid-cols-2 md:gap-4">
      {lain.map((u) => <li key={u.id} className="flex flex-col rounded-3xl bg-tile p-7 md:p-8">
        <Bintang rating={u.rating} />
        <blockquote className="mt-4 flex-1 text-[17px] leading-snug tracking-[-0.01em]">“{u.isi}”</blockquote>
        <div className="mt-6 text-sm">
          <p className="flex items-center gap-1.5 font-medium">{u.nama}<BadgeCheck aria-label="Pembeli terverifikasi" className="size-4 text-foreground/70" /></p>
          <Link href={`/produk/${u.slug}#ulasan-produk`} className="mt-0.5 block truncate text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{u.produk}</Link>
        </div>
      </li>)}
    </ul>}
  </section>;
}
