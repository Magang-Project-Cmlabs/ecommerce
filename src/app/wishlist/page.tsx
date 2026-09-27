// Halaman sementara. Isi asli dikerjakan di kartu Lanjutan "Wishlist"
// (rizkikusnadi03, A3). Baris requireUser() WAJIB dipertahankan.

import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/akses';

export const metadata: Metadata = { title: 'Wishlist — TokoKita', robots: { index: false, follow: false } };

export default async function HalamanWishlist() {
  await requireUser('/wishlist');

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <p className="text-muted-foreground mt-2 text-sm">Wishlist masih kosong.</p>
    </main>
  );
}
