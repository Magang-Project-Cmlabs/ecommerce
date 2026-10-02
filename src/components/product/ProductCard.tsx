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

// Gaya Apple Store: foto di ubin abu muda tanpa bingkai/bayangan, teks rapat di bawahnya,
// harga netral (bukan warna mencolok), satu aksi kecil. Oranye hanya untuk aksi utama.
export default function ProductCard({ product: p, list = false, belowFold = false, eager = false }: { product: ProdukKartu; list?: boolean; belowFold?: boolean; eager?: boolean }) {
  const tambah = useCartStore((s) => s.tambahItem);
  const habis = p.stock <= 0 && !p.isPreorder;
  const diskon = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  return <article className={`geser-naik group relative ${list ? 'grid grid-cols-[112px_1fr] items-center gap-4 sm:grid-cols-[180px_1fr]' : 'flex h-full flex-col'}`}>
    <div className="relative aspect-square overflow-hidden rounded-3xl bg-tile">
      <Link href={`/produk/${p.slug}`} aria-label={`Lihat ${p.name}`} className="relative block size-full"><Image src={p.image || '/placeholder-produk.svg'} alt={p.name} fill quality={50} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : belowFold ? 'low' : 'auto'} sizes={list ? '180px' : '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw'} className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]" /></Link>
      {diskon > 0 && <span className="absolute left-3 top-3 rounded-full bg-zinc-900/85 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">-{diskon}%</span>}
      {habis && <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/65 text-sm font-semibold text-zinc-900 backdrop-blur-[2px]">Habis</span>}
      {!list && <div className="absolute right-2 top-2"><WishlistButton productId={p.id} name={p.name} /></div>}
    </div>
    <div className={`flex min-w-0 flex-1 flex-col ${list ? '' : 'pt-3'}`}>
      <p className="text-xs font-medium text-muted-foreground">{p.brand}{p.isPreorder && <span className="ml-1.5 text-orange-700">· Pre-order</span>}</p>
      <Link href={`/produk/${p.slug}`} className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug tracking-[-0.01em] hover:underline">{p.name}</Link>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Star aria-hidden className="size-3.5 fill-amber-400 text-amber-500" /><span>{p.rating.toFixed(1)} · {p.reviewCount} ulasan</span></p>
      <div className="mt-auto flex flex-col gap-2.5 pt-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="tabular-nums text-base font-semibold tracking-[-0.01em]">{formatRupiah(p.price)}</p>
          {diskon > 0 && <p className="text-xs tabular-nums text-muted-foreground line-through">{formatRupiah(p.compareAtPrice!)}</p>}
        </div>
        {p.hasVariants ? <Button asChild variant={habis ? "secondary" : "default"} className="w-full sm:w-auto" disabled={habis}><Link href={`/produk/${p.slug}`}>{habis ? 'Lihat' : 'Pilih Varian'}</Link></Button>
          : <Button disabled={habis} aria-label={habis ? 'Stok Habis' : 'Tambah ke Keranjang'} className="w-full sm:w-auto" onClick={() => { tambah({ productId: p.id, variantId: null, quantity: 1, slug: p.slug, name: p.name, variantName: null, image: p.image, price: p.price }); toast.success('Ditambahkan ke keranjang'); }}><ShoppingCart aria-hidden className="size-4" /><span>{habis ? 'Habis' : 'Tambah'}</span></Button>}
      </div>
    </div>
    {list && <div className="absolute right-2 top-2"><WishlistButton productId={p.id} name={p.name} /></div>}
  </article>;
}
