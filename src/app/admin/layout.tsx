import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { AdminMenuMobile, AdminSidebar } from '@/components/admin/navigation';
import { Button } from '@/components/ui/button';
import TemaToggle from '@/components/layout/TemaToggle';
import TombolKeluar from '@/components/layout/TombolKeluar';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Layout hanya menampilkan nama; keputusan akses tetap di requireAdmin pada tiap page.tsx.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pengguna = await ambilPenggunaSaatIni();
  const inisial = (pengguna?.name ?? 'A').trim().charAt(0).toUpperCase();
  return (
    <div className="ui-admin flex flex-1 bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex h-[4.5rem] items-center gap-2 px-4 md:px-8 lg:px-10">
            <AdminMenuMobile />
            <span className="font-heading text-xl font-semibold tracking-[-0.045em] lg:hidden">TokoKita<span className="text-sale">.</span></span>
            <p className="hidden min-w-0 truncate text-[15px] text-muted-foreground lg:block">Selamat datang, <span className="font-medium text-foreground">{pengguna?.name ?? 'Admin'}</span></p>
            <TemaToggle className="ml-auto" />
            <nav aria-label="Akun admin" className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="pointer-coarse:h-11"><Link href="/" aria-label="Lihat toko"><ArrowUpRight aria-hidden /><span className="hidden sm:inline">Lihat toko</span></Link></Button>
              <span aria-hidden className="hidden size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background sm:flex">{inisial}</span>
              <TombolKeluar ringkas className="pointer-coarse:h-11" />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-8 md:py-10 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
