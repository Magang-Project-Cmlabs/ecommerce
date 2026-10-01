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
export function AdminNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = <nav aria-label="Navigasi admin" className="space-y-2 p-4">{links.map(({ href, label, icon: Icon }) => {
    const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
    return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${active ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="size-5" />{label}</Link>;
  })}<Link href="/" className="mt-6 flex min-h-11 items-center gap-3 rounded-xl border border-slate-700 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><ArrowUpRight className="size-5" />Lihat toko</Link></nav>;
  return <><aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-slate-900 text-white lg:block"><div className="sticky top-[7.6rem] max-h-[calc(100dvh-7.6rem)] overflow-y-auto pb-6"><div className="px-7 pt-7 text-lg font-bold">Panel admin</div><p className="px-7 pb-3 pt-1 text-xs text-slate-300">Kelola toko dalam satu tempat</p>{nav}</div></aside><div className="border-b p-3 lg:hidden"><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="outline" className="h-11"><Menu />Menu admin</Button></SheetTrigger><SheetContent side="left" className="border-slate-800 bg-slate-900 text-white"><SheetHeader><SheetTitle className="text-white">Panel admin</SheetTitle><SheetDescription className="text-slate-300">Navigasi pengelolaan TokoKita.</SheetDescription></SheetHeader>{nav}</SheetContent></Sheet></div></>;
}
