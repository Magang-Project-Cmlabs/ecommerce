// Halaman sementara. Panel admin dikerjakan fikarnugraha18 (A5) di kartu
// "Tampilan dasar halaman admin". Baris requireAdmin() WAJIB ada di setiap
// halaman /admin/** dan setiap Server Action admin — pengguna selain admin
// mendapat 404.

import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/akses';

export const metadata: Metadata = { title: 'Admin — TokoKita', robots: { index: false, follow: false } };

export default async function HalamanAdmin() {
  const admin = await requireAdmin('/admin');

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">Panel admin</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Masuk sebagai <span className="text-foreground font-medium">{admin.name}</span>. Ringkasan, pesanan, produk, dan
        promo segera hadir.
      </p>
    </main>
  );
}
