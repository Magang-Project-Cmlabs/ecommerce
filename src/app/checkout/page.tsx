// Halaman sementara. Isi asli dikerjakan rizkikusnadi03 (A3) di kartu
// "Checkout langkah 1 & 2". Baris requireUser() WAJIB dipertahankan, dan
// setiap Server Action checkout juga memanggil requireUser() sendiri.

import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/akses';

export const metadata: Metadata = { title: 'Checkout — TokoKita', robots: { index: false, follow: false } };

export default async function HalamanCheckout() {
  await requireUser('/checkout');

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-muted-foreground mt-2 text-sm">Langkah alamat, pengiriman, pembayaran, dan konfirmasi segera hadir.</p>
    </main>
  );
}
