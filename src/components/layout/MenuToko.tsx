'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Kategori } from '@/lib/katalog-types';

/** Menu layar kecil: tautan katalog, kategori, dan status akun dalam satu panel. */
export default function MenuToko({ kategori, akun }: { kategori: Kategori[]; akun: ReactNode }) {
  const [buka, setBuka] = useState(false);
  const tutup = () => setBuka(false);
  const induk = kategori.filter((k) => k.parentId === null);
  return <Sheet open={buka} onOpenChange={setBuka}>
    <SheetTrigger asChild><button type="button" aria-label="Buka menu" className="flex size-11 items-center justify-center rounded-full hover:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"><Menu aria-hidden className="size-[22px]" strokeWidth={1.6} /></button></SheetTrigger>
    <SheetContent side="right" className="flex w-[min(22rem,88vw)] flex-col gap-0 p-0">
      <SheetHeader className="border-b px-6 py-5"><SheetTitle className="font-heading text-xl font-medium tracking-[-0.02em]">Menu</SheetTitle><SheetDescription className="sr-only">Navigasi katalog dan akun TokoKita.</SheetDescription></SheetHeader>
      <nav aria-label="Menu katalog" className="flex-1 overflow-y-auto px-6 py-4">
        {[{ href: '/produk', label: 'Semua Produk' }, { href: '/produk?promo=1', label: 'Promo' }].map((l) => <Link key={l.href} href={l.href} onClick={tutup} className="flex min-h-12 items-center font-heading text-2xl font-medium tracking-[-0.02em]">{l.label}</Link>)}
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Kategori</p>
        <ul className="mt-2">{induk.map((k) => <li key={k.id}><Link href={`/kategori/${k.slug}`} onClick={tutup} className="flex min-h-11 items-center text-base text-foreground/80 hover:text-foreground">{k.name}</Link></li>)}</ul>
      </nav>
      <div className="border-t px-6 py-4" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) tutup(); }}>{akun}</div>
    </SheetContent>
  </Sheet>;
}
