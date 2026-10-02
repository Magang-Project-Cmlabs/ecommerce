'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Star, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { WishlistButton } from './WishlistProvider';
import { useCartStore } from '@/stores/cart-store';
import { formatRupiah } from '@/lib/format';
import type { ProdukKartu } from '@/lib/katalog-types';

// Kartu ala template Framer: foto besar di ubin abu, label diskon kecil, aksi bulat di pojok foto,
// nama dan harga rapat di bawah. Tanpa bingkai, tanpa bayangan, tanpa tombol lebar.
const aksiBulat = 'flex size-11 items-center justify-center rounded-full bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08),0_4px_14px_rgb(0_0_0/0.08)] ring-1 ring-black/5 transition-[transform,background-color,color] duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:scale-90 dark:ring-white/10';

export default function ProductCard({ product: p, list = false, belowFold = false, eager = false }: { product: ProdukKartu; list?: boolean; belowFold?: boolean; eager?: boolean }) {
  const tambah = useCartStore((s) => s.tambahItem);
  const habis = p.stock <= 0 && !p.isPreorder;
  const diskon = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  const aksi = habis ? null : p.hasVariants
    ? <Link href={`/produk/${p.slug}`} aria-label="Pilih Varian" title="Pilih varian" className={aksiBulat}><ArrowUpRight aria-hidden className="size-[18px]" /></Link>
    : <button type="button" aria-label="Tambah ke Keranjang" title="Tambah ke keranjang" className={aksiBulat} onClick={() => { tambah({ productId: p.id, variantId: null, quantity: 1, slug: p.slug, name: p.name, variantName: null, image: p.image, price: p.price }); toast.success('Ditambahkan ke keranjang'); }}><Plus aria-hidden className="size-5" /></button>;

  return <article className={`geser-naik group relative ${list ? 'grid grid-cols-[112px_1fr] items-center gap-4 sm:grid-cols-[180px_1fr]' : 'flex h-full flex-col'}`}>
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-tile">
      <Link href={`/produk/${p.slug}`} aria-label={`Lihat ${p.name}`} className="relative block size-full"><Image src={p.image || '/placeholder-produk.svg'} alt={p.name} fill quality={50} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : belowFold ? 'low' : 'auto'} sizes={list ? '180px' : '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 340px'} className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]" /></Link>
      <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
        {diskon > 0 && <span className="rounded-full bg-sale px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">-{diskon}%</span>}
        {p.isPreorder && <span className="rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground">Pre-order</span>}
      </div>
      {habis && <span className="pointer-events-none absolute inset-x-3 bottom-3 rounded-full bg-background/90 py-2 text-center text-xs font-semibold text-foreground backdrop-blur-sm">Stok habis</span>}
      {!list && <div className="absolute right-2 top-2"><WishlistButton productId={p.id} name={p.name} /></div>}
      {!list && aksi && <div className="absolute bottom-3 right-3 motion-safe:transition-[opacity,transform] motion-safe:duration-300 [@media(hover:hover)_and_(pointer:fine)]:translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:translate-y-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-y-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">{aksi}</div>}
    </div>
    <div className={`flex min-w-0 flex-1 flex-col ${list ? '' : 'pt-3.5'}`}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/produk/${p.slug}`} className="line-clamp-2 text-[15px] font-medium leading-snug tracking-[-0.01em] underline-offset-4 hover:underline">{p.name}</Link>
        <p className="mt-px flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground"><Star aria-hidden className="size-3.5 fill-foreground text-foreground" /><span className="sr-only">Rating</span>{p.rating.toFixed(1)}<span className="sr-only">, {p.reviewCount} ulasan</span></p>
      </div>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{p.brand}</p>
      <p className="mt-1.5 flex items-baseline gap-2 tabular-nums"><span className="text-[15px] font-semibold tracking-[-0.01em]">{formatRupiah(p.price)}</span>{diskon > 0 && <span className="text-[13px] text-muted-foreground line-through"><span className="sr-only">Harga semula </span>{formatRupiah(p.compareAtPrice!)}</span>}</p>
      {list && <div className="mt-3 flex items-center gap-2">{aksi}<WishlistButton productId={p.id} name={p.name} /></div>}
    </div>
  </article>;
}
