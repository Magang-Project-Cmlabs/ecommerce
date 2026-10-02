'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { Minus, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/lib/format';
import { useCartStore, selectItems, selectTerbuka, selectAppliedPromo } from '@/stores/cart-store';
import { cekKodePromo } from '@/actions/promo';
import { pratinjauCheckout, type Pratinjau } from '@/actions/checkout';

export default function CartDrawer() {
  const items = useCartStore(selectItems); const open = useCartStore(selectTerbuka); const appliedPromo = useCartStore(selectAppliedPromo);
  const [code, setCode] = useState(''); const [message, setMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<{ key: string; data: Pratinjau } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [pending, start] = useTransition(); const [promoPending, startPromo] = useTransition();
  const key = JSON.stringify({ items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })), promoCode: appliedPromo?.code });
  const preview = snapshot?.key === key ? snapshot.data : null;
  useEffect(() => {
    let active = true;
    if (!open || !JSON.parse(key).items.length) return;
    start(async () => { try { const data = await pratinjauCheckout(JSON.parse(key)); if (active) { setSnapshot({ key, data }); setError(null); } } catch { if (active) setError({ key, message: 'Harga dan stok belum dapat diperiksa. Muat ulang halaman untuk mencoba kembali.' }); } });
    return () => { active = false; };
  }, [key, open]);
  const changed = preview?.items.some(i => items.find(x => x.productId === i.productId && x.variantId === i.variantId)?.price !== i.price);
  const invalid = preview?.items.some(i => i.masalah) ?? true;
  const apply = (event: React.FormEvent) => {
    event.preventDefault(); if (!preview) return;
    startPromo(async () => { try { const result = await cekKodePromo(code, preview.subtotal); if (result.ok) { useCartStore.getState().setAppliedPromo(result); setMessage('Kode promo berhasil dipakai.'); setCode(''); } else setMessage(result.message); } catch { setMessage('Kode promo belum dapat diperiksa.'); } });
  };
  return <Sheet open={open} onOpenChange={useCartStore.getState().setTerbuka}><SheetContent showCloseButton={false} className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
    <SheetHeader className="border-b pr-16"><SheetTitle>Keranjang Belanja</SheetTitle><SheetDescription>{items.reduce((n, i) => n + i.quantity, 0)} barang</SheetDescription></SheetHeader>
    <Button variant="ghost" size="icon" aria-label="Tutup keranjang" className="absolute right-3 top-3 size-11" onClick={useCartStore.getState().tutupKeranjang}><X className="size-5" /></Button>
    {items.length ? <><div className="min-h-0 flex-1 overflow-y-auto p-4">
      {changed && <p role="status" className="mb-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-300">Harga berubah. Harga terbaru ditampilkan di keranjang.</p>}
      {error?.key === key && <p role="alert" className="mb-3 text-destructive">{error.message}</p>}
      {items.map(item => { const latest = preview?.items.find(i => i.productId === item.productId && i.variantId === item.variantId); const name = latest?.name ?? item.name; return <article key={`${item.productId}:${item.variantId}`} className="flex gap-3 border-b py-4">
        <Link href={`/produk/${item.slug}`} onClick={useCartStore.getState().tutupKeranjang} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">{(latest?.image ?? item.image) && <Image src={(latest?.image ?? item.image)!} alt={name} fill sizes="80px" className="object-cover" />}</Link>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium">{name}</p>{item.variantName && <p className="text-sm text-muted-foreground">{item.variantName}</p>}<p className="mt-1 font-bold text-foreground">{formatRupiah(latest?.price ?? item.price)}</p>
          {latest?.masalah && <p role="alert" className="mt-1 text-sm text-destructive">{latest.masalah === 'tidak_aktif' ? 'Produk sudah tidak dijual.' : latest.masalah === 'varian_wajib' ? 'Pilih varian di detail produk.' : `Stok tersedia ${Math.max(0, latest.stock)}.`}</p>}
          <div className="mt-2 flex items-center gap-1"><Button variant="outline" size="icon" className="size-11" aria-label={`Kurangi jumlah ${name}`} disabled={item.quantity <= 1} onClick={() => useCartStore.getState().ubahJumlah(item.productId, item.variantId, item.quantity - 1)}><Minus className="size-4" /></Button><span className="w-9 text-center tabular-nums" aria-label={`Jumlah ${name}`}>{item.quantity}</span><Button variant="outline" size="icon" className="size-11" aria-label={`Tambah jumlah ${name}`} disabled={item.quantity >= 99 || !!latest && !latest.isPreorder && item.quantity >= latest.stock} onClick={() => useCartStore.getState().ubahJumlah(item.productId, item.variantId, item.quantity + 1)}><Plus className="size-4" /></Button><Button variant="ghost" size="icon" className="ml-auto size-11 text-destructive" aria-label={`Hapus ${name}`} onClick={() => useCartStore.getState().hapusItem(item.productId, item.variantId)}><Trash2 className="size-4" /></Button></div>
        </div></article>; })}
      <form className="mt-4" onSubmit={apply}><Label htmlFor="cart-promo">Kode Promo</Label><div className="mt-2 flex gap-2"><Input id="cart-promo" value={code} maxLength={30} onChange={e => setCode(e.target.value)} placeholder="Masukkan kode" /><Button disabled={promoPending || !preview || !code.trim()}>{promoPending ? <Loader2 className="size-4 animate-spin" /> : 'Pakai'}</Button></div></form>
      {message && <p role="status" className="mt-2 text-sm">{message}</p>}{appliedPromo && <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-muted p-2"><span>{appliedPromo.code}</span><Button variant="ghost" onClick={() => { useCartStore.getState().hapusPromo(); setMessage(null); }}>Hapus Promo</Button></div>}
      {preview?.promo && !preview.promo.ok && <p role="alert" className="mt-2 text-sm text-destructive">{preview.promo.message}</p>}
    </div><div className="space-y-3 border-t bg-card p-4"><dl className="grid grid-cols-2 gap-2 text-sm"><dt>Subtotal</dt><dd className="text-right font-semibold">{preview ? formatRupiah(preview.subtotal) : 'Memeriksa…'}</dd><dt>Diskon</dt><dd className="text-right">{preview ? `−${formatRupiah(preview.discount)}` : '—'}</dd><dt>Ongkir</dt><dd className="text-right text-muted-foreground">Setelah memilih alamat</dd></dl>{pending && <p role="status" className="text-sm text-muted-foreground">Memeriksa harga dan stok…</p>}
      {!preview || invalid || pending ? <Button className="w-full" disabled>Checkout</Button> : <Button asChild className="w-full"><Link href="/checkout" onClick={useCartStore.getState().tutupKeranjang}>Checkout ({formatRupiah(preview.grandTotal)})</Link></Button>}
    </div></> : <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center"><p>Keranjang masih kosong. Yuk belanja!</p><Button asChild><Link href="/produk" onClick={useCartStore.getState().tutupKeranjang}>Mulai Belanja</Link></Button></div>}
  </SheetContent></Sheet>;
}
