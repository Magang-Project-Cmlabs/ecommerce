import Link from 'next/link';
import { Heart, User } from 'lucide-react';
import CartBadge from '@/components/cart/CartBadge';
import { StatusAkun } from './status-akun';
import SearchBox from './SearchBox';
import MobileNavigation from './MobileNavigation';
import MenuToko from './MenuToko';
import TemaToggle from './TemaToggle';
import { ambilBanner, ambilKategori } from '@/lib/data/katalog';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';

const ikon = 'flex size-11 items-center justify-center rounded-full transition-colors hover:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const tautanNav = 'inline-flex h-9 items-center rounded-full px-3.5 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground';

/** Pita berjalan di atas header: isi promo dari banner aktif + informasi harga. */
async function PitaPengumuman() {
  const banner = await ambilBanner();
  const isi = [...banner.map((b) => b.title), 'Harga sudah termasuk PPN 11%', 'Pembayaran aman lewat Midtrans'];
  const baris = (salinan: boolean) => <ul aria-hidden={salinan || undefined} className="flex shrink-0 items-center">
    {isi.map((t, i) => <li key={i} className="flex items-center whitespace-nowrap px-6"><span aria-hidden className="mr-6 text-white/40">✱</span>{t}</li>)}
  </ul>;
  return <div className="overflow-hidden bg-[#0a0a0a] text-white dark:border-b dark:border-white/10">
    <p className="sr-only">Info toko:</p>
    <div className="pita-jalan flex h-9 w-max items-center text-[12px] font-medium uppercase tracking-[0.08em]">{baris(false)}{baris(true)}</div>
  </div>;
}

export default async function Navbar() {
  const kategori = await ambilKategori();
  const induk = kategori.filter((k) => k.parentId === null);
  return <>
    <a href="#konten-utama" className="sr-only fixed left-4 top-4 z-[100] rounded bg-background p-3 focus:not-sr-only">Lewati ke konten utama</a>
    <PitaPengumuman />
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto] items-center gap-x-2 px-4 py-2 md:px-6 lg:grid-cols-[1fr_auto_1fr] lg:py-3">
        <Link href="/" aria-label="TokoKita, beranda" className="justify-self-start font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.045em]">TokoKita<span aria-hidden className="text-sale">.</span></Link>

        <nav aria-label="Katalog" className="hidden items-center gap-1 lg:flex">
          <Link href="/produk" className={tautanNav}>Semua Produk</Link>
          <NavigationMenu><NavigationMenuList><NavigationMenuItem>
            <NavigationMenuTrigger className="h-9 rounded-full bg-transparent px-3.5 text-[15px] font-medium text-foreground/80 hover:bg-foreground/[0.06] hover:text-foreground">Kategori</NavigationMenuTrigger>
            <NavigationMenuContent><div className="grid w-[600px] grid-cols-3 gap-x-6 gap-y-5 p-6">{induk.map((k) => <div key={k.id}>
              <NavigationMenuLink asChild><Link href={`/kategori/${k.slug}`} className="font-heading text-base font-medium">{k.name}</Link></NavigationMenuLink>
              {kategori.filter((s) => s.parentId === k.id).map((s) => <NavigationMenuLink key={s.id} asChild><Link href={`/kategori/${s.slug}`} className="text-sm text-muted-foreground">{s.name}</Link></NavigationMenuLink>)}
            </div>)}</div></NavigationMenuContent>
          </NavigationMenuItem></NavigationMenuList></NavigationMenu>
          <Link href="/produk?promo=1" className={tautanNav}>Promo</Link>
        </nav>

        <div className="flex items-center justify-self-end gap-0.5">
          <div className="mr-2 hidden w-56 lg:block xl:w-72"><SearchBox /></div>
          <TemaToggle />
          <nav aria-label="Belanja" className="flex items-center gap-0.5">
            <Link href="/wishlist" aria-label="Wishlist" title="Wishlist" className={`${ikon} hidden sm:flex`}><Heart aria-hidden className="size-[21px]" strokeWidth={1.6} /></Link>
            <CartBadge />
            <Link href="/akun" aria-label="Akun saya" title="Akun saya" className={`${ikon} hidden sm:flex`}><User aria-hidden className="size-[21px]" strokeWidth={1.6} /></Link>
          </nav>
          <div className="ml-2 hidden lg:block"><StatusAkun /></div>
          <MenuToko kategori={kategori} akun={<StatusAkun />} />
        </div>

        <div className="col-span-2 pb-1 pt-2 lg:hidden"><SearchBox /></div>
      </div>
    </header>
    <MobileNavigation />
  </>;
}
