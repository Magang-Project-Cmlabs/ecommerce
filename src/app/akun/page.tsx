// Halaman Akun Pengguna TokoKita (PRD §5, KONTRAK_CHECKOUT.md).
// Baris requireUser() WAJIB dipertahankan untuk keamanan sesuai penjaga-halaman.test.ts.

import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/akses';
import { prisma } from '@/lib/db';
import { ambilDaftarAlamat } from '@/lib/data/alamat';
import AkunShell from '@/components/account/AkunShell';

export const metadata: Metadata = {
  title: 'Akun Saya — TokoKita',
  robots: { index: false, follow: false },
};

export default async function HalamanAkun() {
  const pengguna = await requireUser('/akun');

  // Ambil rincian profil pengguna dari database dengan pencegahan timeout
  let userDetail = null;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );
    const dbPromise = prisma.user.findFirst({
      where: { id: pengguna.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });
    userDetail = await Promise.race([dbPromise, timeout]);
  } catch {
    // Database offline
  }

  const user = userDetail ?? {
    id: pengguna.id,
    name: pengguna.name,
    email: pengguna.email,
    phone: null,
    role: 'customer' as const,
  };

  const addresses = await ambilDaftarAlamat(pengguna.id);

  return (
    <main className="min-h-full flex-1 bg-gray-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight sm:text-3xl">
            Pengaturan Akun
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Kelola profil informasi pribadi, keamanan kata sandi, buku alamat, dan preferensi akun Anda.
          </p>
        </div>

        <AkunShell user={user} initialAddresses={addresses} />
      </div>
    </main>
  );
}
