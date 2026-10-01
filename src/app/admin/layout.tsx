import Link from 'next/link';
import { ArrowUpRight, Store } from 'lucide-react';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { keluar } from '@/actions/auth';
import { AdminNavigation } from '@/components/admin/navigation';
import { Button } from '@/components/ui/button';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Layout hanya menampilkan nama; keputusan akses tetap di requireAdmin pada tiap page.tsx.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pengguna = await ambilPenggunaSaatIni();
  return (
    <div style={{ '--primary': 'var(--secondary)', '--ring': 'var(--secondary)' } as CSSProperties} className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-8">
          <Link href="/admin" aria-label="TokoKita, ringkasan admin" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight">
            <Store aria-hidden className="size-7 text-orange-600" />
            <span>Toko<span className="text-orange-700">Kita</span></span>
            <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">Admin</span>
          </Link>
          {pengguna && <p className="ml-4 hidden min-w-0 truncate text-sm text-muted-foreground md:block">Selamat datang, <span className="font-medium text-foreground">{pengguna.name}</span></p>}
          <nav aria-label="Akun admin" className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="pointer-coarse:h-11"><Link href="/" aria-label="Lihat toko"><ArrowUpRight aria-hidden /><span className="hidden sm:inline">Lihat toko</span></Link></Button>
            <form action={keluar}><Button type="submit" variant="ghost" size="sm" className="pointer-coarse:h-11">Keluar</Button></form>
          </nav>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-clip lg:flex-row">
        <AdminNavigation />
        <main className="min-w-0 flex-1 bg-muted/40 p-4 md:p-7 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
