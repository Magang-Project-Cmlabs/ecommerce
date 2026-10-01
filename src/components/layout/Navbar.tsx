import Link from 'next/link';
import { Heart, User, Store } from 'lucide-react';
import CartBadge from '@/components/cart/CartBadge';
import { StatusAkun } from './status-akun';
import SearchBox from './SearchBox';
import MobileNavigation from './MobileNavigation';
import { ambilKategori } from '@/lib/data/katalog';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';

export default async function Navbar() {
  const kategori = await ambilKategori();
  return <>
    <a href="#konten-utama" className="sr-only fixed left-4 top-4 z-[100] rounded bg-background p-3 focus:not-sr-only">Lewati ke konten utama</a>
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:gap-6">
        <Link href="/" aria-label="TokoKita, beranda" className="mr-auto flex items-center gap-2 text-2xl font-extrabold tracking-tight md:mr-0"><Store aria-hidden className="size-8 text-orange-600" /><span>Toko<span className="text-orange-700">Kita</span></span></Link>
        <div className="order-3 w-full md:order-none md:min-w-0 md:flex-1"><SearchBox /></div>
        <nav aria-label="Belanja" className="flex shrink-0 items-center gap-2">
          <Link href="/wishlist" aria-label="Wishlist" title="Wishlist" className="flex size-11 items-center justify-center rounded-full hover:bg-muted"><Heart className="size-6" /></Link>
          <div className="flex size-11 items-center justify-center"><CartBadge /></div>
          <Link href="/akun" aria-label="Akun saya" title="Akun saya" className="flex size-11 items-center justify-center rounded-full hover:bg-muted"><User className="size-6" /></Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 pb-2">
        <nav aria-label="Katalog" className="flex items-center gap-4 text-sm">
          <Link href="/produk" className="font-medium hover:text-orange-700">Semua Produk</Link>
          <div className="hidden md:block"><NavigationMenu><NavigationMenuList><NavigationMenuItem><NavigationMenuTrigger className="h-9">Kategori</NavigationMenuTrigger><NavigationMenuContent><div className="grid w-[560px] grid-cols-3 gap-4 p-4">{kategori.filter((k) => k.parentId === null).map((k) => <div key={k.id}><NavigationMenuLink asChild><Link href={`/kategori/${k.slug}`} className="font-semibold">{k.name}</Link></NavigationMenuLink>{kategori.filter((s) => s.parentId === k.id).map((s) => <NavigationMenuLink key={s.id} asChild><Link href={`/kategori/${s.slug}`} className="text-sm text-muted-foreground">{s.name}</Link></NavigationMenuLink>)}</div>)}</div></NavigationMenuContent></NavigationMenuItem></NavigationMenuList></NavigationMenu></div>
          <Link href="/produk?promo=1" className="font-medium text-orange-700">Promo</Link>
        </nav>
        <StatusAkun />
      </div>
    </header>
    <MobileNavigation />
  </>;
}
