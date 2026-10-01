'use client';
import { createContext, useContext, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { simpanWishlist } from '@/actions/katalog';
import { Button } from '@/components/ui/button';

const WishlistContext = createContext({ ids: [] as number[], login: false, ubah: (_id: number, _simpan: boolean) => {} });
export function WishlistProvider({ children, ids: initialIds, login }: { children: React.ReactNode; ids: number[]; login: boolean }) {
  const [ids, setIds] = useState(initialIds);
  const ubah = (id: number, simpan: boolean) => setIds((lama) => simpan ? [...new Set([...lama, id])] : lama.filter((n) => n !== id));
  return <WishlistContext value={{ ids, login, ubah }}>{children}</WishlistContext>;
}
export function WishlistButton({ productId, name, text = false }: { productId: number; name: string; text?: boolean }) {
  const { ids, login, ubah } = useContext(WishlistContext);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const tersimpan = ids.includes(productId);
  function klik() {
    if (!login) { router.push(`/masuk?next=${encodeURIComponent(`/wishlist?tambah=${productId}`)}`); return; }
    startTransition(async () => {
      const hasil = await simpanWishlist({ productId, simpan: !tersimpan });
      if (hasil.success) { ubah(productId, !tersimpan); toast.success(hasil.message); }
      else toast.error(hasil.message);
    });
  }
  return <Button variant="outline" size={text ? 'default' : 'icon'} onClick={klik} disabled={pending} aria-pressed={tersimpan} aria-label={`${tersimpan ? 'Hapus' : 'Simpan'} ${name} ${tersimpan ? 'dari' : 'ke'} wishlist`} className={`${text ? 'h-11' : 'size-11 rounded-full'} bg-background/95`}><Heart className={`size-5 ${tersimpan ? 'fill-red-600 text-red-600' : ''}`} />{text && (tersimpan ? 'Tersimpan' : 'Wishlist')}</Button>;
}
export function LanjutkanWishlist({ productId }: { productId: number }) {
  const { ubah } = useContext(WishlistContext);
  const router = useRouter();
  useEffect(() => {
    let hidup = true;
    simpanWishlist({ productId, simpan: true }).then((hasil) => {
      if (!hidup) return;
      if (hasil.success) { ubah(productId, true); toast.success(hasil.message); }
      else toast.error(hasil.message);
      router.replace('/wishlist');
    });
    return () => { hidup = false; };
    // Jalankan sekali untuk produk yang dibawa dari proses masuk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, router]);
  return <p role="status" className="text-sm text-muted-foreground">Menyimpan produk ke wishlist…</p>;
}
