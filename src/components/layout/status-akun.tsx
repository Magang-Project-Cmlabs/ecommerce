// Status akun + tombol Keluar. Sementara ditaruh sebagai bar tipis di
// layout; A2 (azridalimunthe7) memindahkannya ke header saat kartu
// "Header dan footer website" dikerjakan.

import Link from 'next/link';
import { keluar } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';

export async function StatusAkun() {
  const pengguna = await ambilPenggunaSaatIni();

  if (!pengguna) {
    return (
      <nav aria-label="Akun" className="flex items-center gap-2 text-sm">
        <Link href="/masuk" className="font-medium underline-offset-4 hover:underline">
          Masuk
        </Link>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <Link href="/daftar" className="font-medium underline-offset-4 hover:underline">
          Daftar
        </Link>
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
      <form action={keluar}>
        <Button type="submit" variant="outline" size="sm" className="pointer-coarse:h-11 pointer-coarse:px-4">
          Keluar
        </Button>
      </form>
    </nav>
  );
}
