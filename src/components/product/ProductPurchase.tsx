'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WishlistButton } from './WishlistProvider';
import { useCartStore } from '@/stores/cart-store';
import { formatRupiah } from '@/lib/format';
import type { ProdukDetail } from '@/lib/katalog-types';
export default function ProductPurchase({ product: p }: { product: ProdukDetail }) {
  const [varian, setVarian] = useState(''); const [quantity, setQuantity] = useState(1);
  const tambah = useCartStore((s) => s.tambahItem); const tutup = useCartStore((s) => s.tutupKeranjang);
  const router = useRouter();
  const selected = p.variants.find((v) => String(v.id) === varian);
  const price = selected?.price ?? p.price; const stock = selected?.stock ?? p.stock;
  const max = Math.min(99, p.isPreorder ? 99 : stock);
  const habis = max <= 0;
  const diskon = p.compareAtPrice && p.compareAtPrice > price ? Math.round((1 - price / p.compareAtPrice) * 100) : 0;
  function add(beli: boolean) {
    if (p.hasVariants && !selected) { toast.error(`Pilih ${p.variantLabel?.toLowerCase() || 'varian'} terlebih dahulu.`); return; }
    const item = useCartStore.getState().items.find((it) => it.productId === p.id && it.variantId === (selected?.id ?? null));
    if (habis || quantity > max || quantity + (item?.quantity ?? 0) > max) { toast.error('Stok tidak mencukupi'); return; }
    tambah({ productId: p.id, variantId: selected?.id ?? null, quantity, slug: p.slug, name: p.name, variantName: selected?.name ?? null, image: p.image, price });
    toast.success('Ditambahkan ke keranjang');
    if (beli) { tutup(); router.push('/checkout'); }
  }
  return <div className="space-y-6"><div aria-live="polite"><p className="tabular-nums text-3xl font-bold text-orange-600">{formatRupiah(price)}</p>{diskon > 0 && <div className="mt-2 flex flex-wrap items-center gap-3"><span className="tabular-nums text-sm text-muted-foreground line-through">{formatRupiah(p.compareAtPrice!)}</span><span className="rounded bg-orange-700 px-2 py-1 text-xs font-bold text-white">Hemat {diskon}%</span></div>}<p className="mt-2 text-xs text-muted-foreground">Harga sudah termasuk PPN 11%.</p></div>
    {!!p.variants.length && <fieldset><legend className="mb-3 text-sm font-medium">{p.variantLabel || 'Varian'}{selected && `: ${selected.name}`}</legend><ToggleGroup type="single" value={varian} onValueChange={(v) => { setVarian(v); setQuantity(1); }} aria-label={`Pilih ${p.variantLabel || 'varian'}`} variant="outline" className="flex-wrap">{p.variants.map((v) => <ToggleGroupItem key={v.id} value={String(v.id)} disabled={v.stock <= 0 && !p.isPreorder} aria-label={`${v.name}${v.stock <= 0 && !p.isPreorder ? ', habis' : ''}`} className="h-11 min-w-11 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{v.name}</ToggleGroupItem>)}</ToggleGroup></fieldset>}
    <p aria-live="polite" className={`text-sm ${habis ? 'text-destructive' : 'text-muted-foreground'}`}>{p.isPreorder ? 'Pre-order — estimasi kirim tertera pada spesifikasi.' : p.hasVariants && !selected ? 'Pilih varian untuk melihat stok.' : habis ? 'Stok Habis' : `Tersedia ${stock} barang`}</p>
    <div><Label htmlFor="jumlah-produk">Jumlah</Label><div className="mt-2 flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Kurangi jumlah" className="size-11" disabled={quantity <= 1 || habis} onClick={() => setQuantity((q) => q - 1)}><Minus className="size-4" /></Button><Input id="jumlah-produk" type="number" min={1} max={Math.max(1, max)} value={quantity} disabled={habis} onChange={(e) => setQuantity(Math.min(Math.max(1, Math.floor(Number(e.target.value) || 1)), Math.max(1, max)))} className="h-11 w-20 text-center tabular-nums" /><Button variant="outline" size="icon" aria-label="Tambah jumlah" className="size-11" disabled={quantity >= max || habis} onClick={() => setQuantity((q) => q + 1)}><Plus className="size-4" /></Button></div></div>
    <div className="flex flex-wrap gap-3"><Button onClick={() => add(false)} disabled={habis} className="h-12 flex-1 basis-full sm:basis-auto"><ShoppingCart className="size-5" />Masukkan Keranjang</Button><Button onClick={() => add(true)} disabled={habis} variant="outline" className="h-12 flex-1">Beli Sekarang</Button><WishlistButton productId={p.id} name={p.name} text /></div>
    <div className="space-y-3 border-t pt-5 text-sm text-muted-foreground"><p className="flex items-center gap-2"><ShieldCheck className="size-5" />Pembayaran aman, harga dihitung ulang saat checkout.</p><p className="flex items-center gap-2"><Truck className="size-5" />JNE Regular, SiCepat REG, atau GoSend Instant.</p></div>
  </div>;
}
