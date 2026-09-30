// Halaman Riwayat Pesanan Pembeli (PRD §7.7, §10.6, kartu A3).
// Baris requireUser() WAJIB dipertahankan untuk keamanan sesuai penjaga-halaman.test.ts.

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth/akses';
import { ambilDaftarPesanan } from '@/lib/data/pesanan';
import DaftarPesananClient from '@/components/pesanan/DaftarPesananClient';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Pesanan Saya — TokoKita',
  robots: { index: false, follow: false },
};

export default async function HalamanDaftarPesanan() {
  const pengguna = await requireUser('/akun/pesanan');
  const orders = await ambilDaftarPesanan(pengguna.id);

  return (
    <main className="min-h-full flex-1 bg-gray-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 -ml-2 text-xs text-gray-500 hover:text-gray-900"
              >
                <Link href="/akun">
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  Kembali ke Akun
                </Link>
              </Button>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Riwayat Pesanan
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Pantau status pengiriman, lakukan pembayaran, atau kelola pesanan belanjaan Anda.
            </p>
          </div>
        </div>

        <DaftarPesananClient orders={orders} />
      </div>
    </main>
  );
}
