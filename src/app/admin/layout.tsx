import Link from 'next/link';
import { ArrowUpRight, LogOut } from 'lucide-react';
import type { Metadata } from 'next';
import { keluar } from '@/actions/auth';
import { AdminMenuMobile, AdminSidebar } from '@/components/admin/navigation';
import { Button } from '@/components/ui/button';
import TemaToggle from '@/components/layout/TemaToggle';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Layout hanya menampilkan nama; keputusan akses tetap di requireAdmin pada tiap page.tsx.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pengguna = await ambilPenggunaSaatIni();
  const inisial = (pengguna?.name ?? 'A').trim().charAt(0).toUpperCase();
  return (
    <div className="flex flex-1 bg-tile/60">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex h-16 items-center gap-3 px-4 md:px-7 lg:px-8">
            <AdminMenuMobile />
            <span className="font-heading text-lg font-semibold tracking-[-0.04em] sm:hidden">TokoKita<span className="text-sale">.</span> <span className="font-sans text-xs font-medium tracking-normal text-muted-foreground">Admin</span></span>
            <p className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">Selamat datang, <span className="font-semibold text-foreground">{pengguna?.name ?? 'Admin'}</span></p>
            <TemaToggle className="ml-auto" />
            <nav aria-label="Akun admin" className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="pointer-coarse:h-11"><Link href="/" aria-label="Lihat toko"><ArrowUpRight aria-hidden /><span className="hidden sm:inline">Lihat toko</span></Link></Button>
              <span aria-hidden className="hidden size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background sm:flex">{inisial}</span>
              <form action={keluar}><Button type="submit" variant="ghost" size="sm" className="pointer-coarse:h-11"><LogOut aria-hidden className="sm:hidden" /><span className="max-sm:sr-only">Keluar</span></Button></form>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-7 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
