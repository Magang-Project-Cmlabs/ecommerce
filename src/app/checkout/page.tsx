// Halaman Checkout TokoKita (PRD §7.6, kartu A3 Hari 3).
// Baris requireUser() WAJIB dipertahankan untuk keamanan sesuai penjaga-halaman.test.ts.

import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/akses';
import { ambilDaftarAlamat } from '@/lib/data/alamat';
import CheckoutWizard from '@/components/checkout/CheckoutWizard';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default async function HalamanCheckout() {
  const pengguna = await requireUser('/checkout');
  const addresses = await ambilDaftarAlamat(pengguna.id);

  return (
    <main className="min-h-full flex-1 bg-gray-50/50 py-6 sm:py-10">
      <CheckoutWizard initialAddresses={addresses} user={pengguna} />
    </main>
  );
}
