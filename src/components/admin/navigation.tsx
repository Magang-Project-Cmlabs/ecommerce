'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Package, Tags, TicketPercent, ImageIcon, Menu, ArrowUpRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';

// Bahasa visual sama dengan toko: latar terang/gelap mengikuti tema, menu berupa pil,
// item aktif berbalik warna (hitam di mode terang, putih di mode gelap).
const links = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard }, { href: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/produk', label: 'Produk', icon: Package }, { href: '/admin/kategori', label: 'Kategori', icon: Tags },
  { href: '/admin/promo', label: 'Kode promo', icon: TicketPercent }, { href: '/admin/banner', label: 'Banner', icon: ImageIcon },
];

function Merek() {
  return <Link href="/admin" className="flex items-baseline gap-2">
    <span className="font-heading text-[1.45rem] font-semibold leading-none tracking-[-0.045em]">TokoKita<span className="text-sale">.</span></span>
    <span className="rounded-full bg-foreground/[0.07] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Admin</span><span className="sr-only">, ringkasan</span>
  </Link>;
}

function DaftarMenu({ onPilih }: { onPilih?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Navigasi admin" className="flex flex-1 flex-col gap-1 px-3">
    {links.map(({ href, label, icon: Icon }) => {
      const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} onClick={onPilih} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-full px-4 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active ? 'bg-foreground text-background' : 'text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground'}`}><Icon aria-hidden className="size-[18px]" strokeWidth={1.8} />{label}</Link>;
    })}
    <Link href="/" onClick={onPilih} className="mt-auto mb-5 flex min-h-11 items-center gap-3 rounded-full border border-border px-4 text-[15px] text-foreground/70 transition-colors hover:bg-foreground/[0.04] hover:text-foreground"><ArrowUpRight aria-hidden className="size-[18px]" />Lihat toko</Link>
  </nav>;
}

/** Sidebar desktop: menempel penuh setinggi layar di tepi kiri. */
export function AdminSidebar() {
  return <div className="hidden w-64 shrink-0 border-r border-border bg-background lg:block"><aside className="sticky top-0 flex h-dvh flex-col">
    <div className="flex h-[4.5rem] shrink-0 items-center px-7"><Merek /></div>
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-3"><DaftarMenu /></div>
  </aside></div>;
}

/** Tombol menu untuk layar kecil; membuka sidebar yang sama sebagai Sheet. */
export function AdminMenuMobile() {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><button type="button" aria-label="Menu admin" className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"><Menu aria-hidden className="size-[22px]" strokeWidth={1.6} /></button></SheetTrigger>
    <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
      <SheetHeader className="h-[4.5rem] justify-center px-7"><SheetTitle className="sr-only">Menu admin</SheetTitle><Merek /><SheetDescription className="sr-only">Navigasi pengelolaan TokoKita.</SheetDescription></SheetHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2"><DaftarMenu onPilih={() => setOpen(false)} /></div>
    </SheetContent>
  </Sheet>;
}
