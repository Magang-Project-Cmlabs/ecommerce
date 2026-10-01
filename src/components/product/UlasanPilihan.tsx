import Link from 'next/link';
import { BadgeCheck, Star } from 'lucide-react';
import type { UlasanBeranda } from '@/lib/beranda';

/** Ulasan terverifikasi nyata dari pembeli (bukan testimoni karangan). Kosong -> bagian disembunyikan. */
export function UlasanPilihan({ ulasan }: { ulasan: UlasanBeranda[] }) {
  if (!ulasan.length) return null;
  return <section aria-labelledby="judul-ulasan" className="muncul border-t py-12">
    <h2 id="judul-ulasan" className="text-xl font-bold tracking-tight md:text-2xl">Kata pembeli</h2>
    <p className="mt-1 text-sm text-muted-foreground">Ulasan dari pembeli yang pesanannya sudah diterima.</p>
    <ul className="mt-5 grid gap-4 md:grid-cols-3">
      {ulasan.map((u) => <li key={u.id} className="flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-orange-900/10">
        <div className="flex items-center gap-0.5" role="img" aria-label={`Rating ${u.rating} dari 5`}>
          {Array.from({ length: 5 }, (_, i) => <Star key={i} aria-hidden className={`size-4 ${i < u.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />)}
        </div>
        <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">“{u.isi}”</blockquote>
        <div className="mt-4 border-t pt-3 text-sm">
          <p className="flex items-center gap-1.5 font-medium">{u.nama}<BadgeCheck aria-label="Pembeli terverifikasi" className="size-4 text-green-600" /></p>
          <Link href={`/produk/${u.slug}#ulasan-produk`} className="mt-0.5 block truncate text-muted-foreground underline-offset-4 hover:text-orange-700 hover:underline">{u.produk}</Link>
        </div>
      </li>)}
    </ul>
  </section>;
}
