'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WishlistButton } from './WishlistProvider';
import { useCartStore } from '@/stores/cart-store';
import { formatRupiah } from '@/lib/format';
import type { ProdukKartu } from '@/lib/katalog-types';

export default function ProductCard({ product: p, list = false, belowFold = false, eager = false }: { product: ProdukKartu; list?: boolean; belowFold?: boolean; eager?: boolean }) {
  const tambah = useCartStore((s) => s.tambahItem);
  const habis = p.stock <= 0 && !p.isPreorder;
  const diskon = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  return <article className={`geser-naik group relative overflow-hidden rounded-2xl border bg-card shadow-sm motion-safe:transition-[transform,box-shadow] motion-safe:duration-300 motion-safe:hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-900/10 ${list ? 'grid grid-cols-[112px_1fr] sm:grid-cols-[180px_1fr]' : 'flex h-full flex-col'}`}>
    <div className="relative aspect-square overflow-hidden bg-muted">
      <Link href={`/produk/${p.slug}`} aria-label={`Lihat ${p.name}`} className="relative block size-full"><Image src={p.image || '/placeholder-produk.svg'} alt={p.name} fill quality={50} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : belowFold ? 'low' : 'auto'} sizes={list ? '180px' : '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw'} className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-105" /></Link>
      {diskon > 0 && <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">-{diskon}%</span>}
      {habis && <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-900/60 font-semibold text-white">Habis</span>}
      {!list && <div className="absolute right-2 top-2"><WishlistButton productId={p.id} name={p.name} /></div>}
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{p.brand}</p>
      <Link href={`/produk/${p.slug}`} className="line-clamp-2 text-base font-medium leading-snug hover:underline">{p.name}</Link>
      <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"><Star aria-hidden className="size-4 fill-amber-400 text-amber-600" /><span>{p.rating.toFixed(1)} ({p.reviewCount} ulasan)</span></p>
      <p className="tabular-nums text-lg font-bold text-orange-700 sm:text-xl sm:text-orange-600">{formatRupiah(p.price)}</p>
      {diskon > 0 && <p className="text-xs tabular-nums text-muted-foreground line-through">{formatRupiah(p.compareAtPrice!)}</p>}
      {p.isPreorder && <p className="text-xs font-medium text-secondary">Pre-order</p>}
      <div className="mt-auto pt-2">
        {p.hasVariants ? <Button asChild className="h-11 w-full rounded-full px-2 text-xs sm:text-sm" disabled={habis}><Link href={`/produk/${p.slug}`}>{habis ? 'Lihat Produk' : 'Pilih Varian'}</Link></Button>
          : <Button disabled={habis} className="h-11 w-full rounded-full px-2 text-xs sm:text-sm" onClick={() => { tambah({ productId: p.id, variantId: null, quantity: 1, slug: p.slug, name: p.name, variantName: null, image: p.image, price: p.price }); toast.success('Ditambahkan ke keranjang'); }}><ShoppingCart aria-hidden className="hidden size-4 sm:block" />{habis ? 'Stok Habis' : 'Tambah ke Keranjang'}</Button>}
      </div>
    </div>
    {list && <div className="absolute right-2 top-2"><WishlistButton productId={p.id} name={p.name} /></div>}
  </article>;
}
