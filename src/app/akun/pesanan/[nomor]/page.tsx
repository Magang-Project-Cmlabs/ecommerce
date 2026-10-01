// Halaman Detail Pesanan Pembeli (PRD §7.7, §10.6).
// Baris requireUser() WAJIB dipertahankan untuk keamanan sesuai penjaga-halaman.test.ts.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/akses';
import { ambilDetailPesanan } from '@/lib/data/pesanan';
import DetailPesananClient from '@/components/pesanan/DetailPesananClient';

export const metadata: Metadata = {
  title: 'Detail Pesanan — TokoKita',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ nomor: string }>;
};

export default async function HalamanDetailPesanan({ params }: Props) {
  const { nomor } = await params;
  const pengguna = await requireUser('/akun/pesanan/' + nomor);

  const order = await ambilDetailPesanan(nomor, pengguna.id);
  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-full flex-1 bg-gray-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <DetailPesananClient order={order} gatewayEnabled={!!process.env.MIDTRANS_SERVER_KEY} sandbox={process.env.MIDTRANS_IS_PRODUCTION !== 'true'} simulationEnabled={process.env.NODE_ENV !== 'production' && process.env.PAYMENT_SIMULATION_ENABLED === 'true'} />
      </div>
    </main>
  );
}
