'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, User, Home, Grid2X2 } from 'lucide-react';

export default function MobileNavigation() {
  const pathname = usePathname();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null;
  return <nav aria-label="Navigasi mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)] shadow-sm md:hidden">
    {[{ href: '/', label: 'Beranda', icon: Home }, { href: '/produk', label: 'Kategori', icon: Grid2X2 }, { href: '/wishlist', label: 'Wishlist', icon: Heart }, { href: '/akun', label: 'Akun', icon: User }].map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs hover:bg-muted ${pathname === href ? 'text-orange-700' : ''}`}><Icon aria-hidden className="size-5" />{label}</Link>)}
  </nav>;
}
