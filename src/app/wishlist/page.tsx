import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/akses';
import { ambilWishlist } from '@/lib/data/katalog';
import ProductCard from '@/components/product/ProductCard';
import { LanjutkanWishlist } from '@/components/product/WishlistProvider';
import { Button } from '@/components/ui/button';
export const metadata: Metadata = { title: 'Wishlist', robots: { index: false, follow: false } };
export default async function HalamanWishlist({ searchParams }: PageProps<'/wishlist'>) {
  const pengguna = await requireUser('/wishlist');
  const produk = await ambilWishlist(pengguna.id);
  const params = await searchParams; const tambah = Number(params.tambah);
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8"><h1 className="text-2xl font-bold">Wishlist</h1><p className="mt-2 text-sm text-muted-foreground">Simpan produk favorit Anda untuk dibeli nanti.</p>{Number.isSafeInteger(tambah) && tambah > 0 && <LanjutkanWishlist productId={tambah} />}{produk.length ? <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{produk.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <div className="mt-6 rounded-xl border border-dashed p-12 text-center"><p>Wishlist masih kosong.</p><Button asChild className="mt-5"><Link href="/produk">Cari Produk Favorit</Link></Button></div>}</main>;
}
