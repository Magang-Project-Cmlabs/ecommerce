'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Package, Tags, TicketPercent, ImageIcon, Menu, ArrowUpRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard }, { href: '/admin/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/produk', label: 'Produk', icon: Package }, { href: '/admin/kategori', label: 'Kategori', icon: Tags },
  { href: '/admin/promo', label: 'Kode promo', icon: TicketPercent }, { href: '/admin/banner', label: 'Banner', icon: ImageIcon },
];

function Merek() {
  return <Link href="/admin" aria-label="TokoKita, ringkasan admin" className="flex items-center gap-2 text-white">
    <span className="font-heading text-xl font-semibold tracking-[-0.04em]">TokoKita<span className="text-sale">.</span></span>
    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200">Admin</span>
  </Link>;
}

function DaftarMenu({ onPilih }: { onPilih?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Navigasi admin" className="flex flex-1 flex-col gap-1 px-3">
    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Menu</p>
    {links.map(({ href, label, icon: Icon }) => {
      const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
      return <Link key={href} href={href} onClick={onPilih} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${active ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}><Icon aria-hidden className="size-[18px]" />{label}</Link>;
    })}
    <Link href="/" onClick={onPilih} className="mt-auto mb-4 flex min-h-11 items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"><ArrowUpRight aria-hidden className="size-[18px]" />Lihat toko</Link>
  </nav>;
}

/** Sidebar desktop: menempel penuh setinggi layar di tepi kiri. */
export function AdminSidebar() {
  return <div className="hidden w-60 shrink-0 bg-[#0a0a0a] lg:block dark:border-r dark:border-white/10"><aside className="sticky top-0 flex h-dvh flex-col text-white">
    <div className="flex h-16 shrink-0 items-center px-6"><Merek /></div>
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-4"><DaftarMenu /></div>
  </aside></div>;
}

/** Tombol menu untuk layar kecil; membuka sidebar yang sama sebagai Sheet. */
export function AdminMenuMobile() {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="outline" size="icon" className="size-11 lg:hidden" aria-label="Menu admin"><Menu /></Button></SheetTrigger>
    <SheetContent side="left" className="flex w-72 flex-col border-zinc-800 bg-[#0a0a0a] p-0 text-white">
      <SheetHeader className="h-16 justify-center px-6"><SheetTitle className="sr-only">Menu admin</SheetTitle><Merek /><SheetDescription className="sr-only">Navigasi pengelolaan TokoKita.</SheetDescription></SheetHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2"><DaftarMenu onPilih={() => setOpen(false)} /></div>
    </SheetContent>
  </Sheet>;
}
