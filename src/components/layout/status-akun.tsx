// Status akun di header (desktop) dan di menu layar kecil: Masuk/Daftar atau Panel Admin + Keluar.

import Link from 'next/link';
import TombolKeluar from './TombolKeluar';
import { Button } from '@/components/ui/button';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';

export async function StatusAkun() {
  const pengguna = await ambilPenggunaSaatIni();

  if (!pengguna) {
    return (
      <nav aria-label="Akun" className="flex items-center gap-1.5 text-sm">
        <Button asChild variant="ghost" size="sm" className="pointer-coarse:h-11 pointer-coarse:px-4">
          <Link href="/masuk">Masuk</Link>
        </Button>
        <Button asChild size="sm" className="pointer-coarse:h-11 pointer-coarse:px-4">
          <Link href="/daftar">Daftar</Link>
        </Button>
      </nav>
    );
  }

  return (
    <nav aria-label="Akun" className="flex items-center gap-3 text-sm">
      {pengguna.role === 'admin' && (
        <Button asChild size="sm" className="pointer-coarse:h-11 pointer-coarse:px-4">
          <Link href="/admin">Panel Admin</Link>
        </Button>
      )}
      <span className="text-muted-foreground hidden max-w-[12rem] truncate xl:inline">
        Halo, <span className="text-foreground font-medium">{pengguna.name}</span>
      </span>
      <TombolKeluar className="pointer-coarse:h-11 pointer-coarse:px-4" />
    </nav>
  );
}
