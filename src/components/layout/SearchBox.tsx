'use client';
import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import type { ProdukKartu } from '@/lib/katalog-types';
import { formatRupiah } from '@/lib/format';

const subscribeToHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export default function SearchBox() {
  // Jangan menerima isian sebelum handler input terpasang pada HTML server.
  const hydrated = useSyncExternalStore(subscribeToHydration, clientHydrated, serverHydrated);
  const [q, setQ] = useState('');
  const [hasil, setHasil] = useState<ProdukKartu[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [aktif, setAktif] = useState(-1);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setGagal(false);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json() as { products: ProdukKartu[] };
        if (!controller.signal.aborted) setHasil(data.products);
      } catch { if (!controller.signal.aborted) { setHasil([]); setGagal(true); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q]);
  return <Popover open={open && q.trim().length >= 2} onOpenChange={setOpen}>
    <PopoverAnchor asChild><form ref={formRef} action="/produk" role="search" className="flex w-full items-center rounded-full bg-muted p-1" onSubmit={(e) => { if (aktif >= 0 && hasil[aktif]) { e.preventDefault(); router.push(`/produk/${hasil[aktif].slug}`); } setOpen(false); }}>
      <Search aria-hidden className="ml-3 size-5 shrink-0 text-muted-foreground" />
      <label htmlFor="pencarian-produk" className="sr-only">Cari produk, merek...</label>
      <Input id="pencarian-produk" role="combobox" disabled={!hydrated} aria-expanded={open && q.trim().length >= 2} aria-controls="saran-pencarian" aria-autocomplete="list" aria-activedescendant={aktif >= 0 ? `saran-${aktif}` : undefined} type="search" name="q" maxLength={100} placeholder="Cari produk, merek..." value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); setAktif(-1); setHasil([]); }} onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
        if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setAktif((a) => Math.min(a + 1, hasil.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setAktif((a) => Math.max(-1, a - 1)); }
      }} className="h-11 min-w-0 border-0 bg-transparent shadow-none" />
      <Button type="submit" size="icon" variant="ghost" disabled={!hydrated} aria-label="Cari produk" className="size-11 shrink-0 rounded-full text-zinc-700 hover:bg-zinc-900/[0.06]"><Search className="size-5" /></Button>
    </form></PopoverAnchor>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-2" onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => { if (formRef.current?.contains(e.target as Node)) e.preventDefault(); }}>
      <div id="saran-pencarian" role="listbox" aria-label="Saran produk" aria-busy={loading}>
        {loading ? <p role="status" className="p-3 text-sm text-muted-foreground">Mencari produk…</p> : hasil.length ? hasil.map((p, i) => <Link key={p.id} role="option" aria-selected={aktif === i} id={`saran-${i}`} href={`/produk/${p.slug}`} onClick={() => setOpen(false)} className={`flex items-center justify-between gap-3 rounded p-3 text-sm hover:bg-muted ${aktif === i ? 'bg-muted' : ''}`}><span className="min-w-0 truncate">{p.name}</span><span className="shrink-0 font-semibold text-orange-700">{formatRupiah(p.price)}</span></Link>) : <p className="p-3 text-sm text-muted-foreground">{gagal ? 'Saran belum tersedia. Gunakan tombol pencarian.' : 'Produk tidak ditemukan. Coba kata kunci lain.'}</p>}
      </div>
      <Link href={`/produk?q=${encodeURIComponent(q.trim())}`} onClick={() => setOpen(false)} className="block border-t p-3 text-sm font-medium text-secondary">Lihat semua hasil pencarian</Link>
    </PopoverContent>
  </Popover>;
}
