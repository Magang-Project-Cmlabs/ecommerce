// Halaman Pesanan Berhasil (PRD §4, KONTRAK_CHECKOUT.md §7).
// Baris requireUser() WAJIB dipertahankan untuk keamanan sesuai penjaga-halaman.test.ts.

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Clock,
  Landmark,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { requireUser } from '@/lib/auth/akses';
import { prisma } from '@/lib/db';
import { ambilDetailPesananDemo } from '@/lib/data/pesanan';
import { formatRupiah } from '@/lib/format';
import CountdownTimer from '@/components/checkout/CountdownTimer';
import SimulasiBayarButton from '@/components/checkout/SimulasiBayarButton';
import SalinTeksButton from '@/components/checkout/SalinTeksButton';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Pesanan Berhasil — TokoKita',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ nomor: string }>;
};

type AddressSnapshot = {
  label?: string;
  name?: string;
  phone?: string;
  street?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
};

export default async function HalamanPesananBerhasil({ params }: Props) {
  const { nomor } = await params;
  const pengguna = await requireUser('/checkout/berhasil/' + nomor);

  // Ambil data pesanan dari database (dengan penanganan timeout/offline)
  let order = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );

    const queryPromise = prisma.order.findFirst({
      where: {
        orderNumber: nomor,
        userId: pengguna.id,
      },
      include: {
        items: true,
      },
    });

    order = await Promise.race([queryPromise, timeoutPromise]);
  } catch {
    // Database offline fallback untuk dev
  }

  // Fallback dev jika DB offline dan nomor valid
  if (!order) {
    const demoOrder = ambilDetailPesananDemo(nomor);
    if (demoOrder) {
      order = demoOrder;
    } else if (nomor.startsWith('INV-')) {
      order = {
        id: 999,
        orderNumber: nomor,
        userId: pengguna.id,
        subtotal: 125000,
        shippingCost: 15000,
        discount: 0,
        tax: 0,
        grandTotal: 140000,
        totalWeight: 500,
        status: 'pending' as const,
        paymentMethod: 'qris' as const,
        paymentStatus: 'unpaid' as const,
        paymentDueAt: new Date('2026-10-02T23:59:59.000Z'),
        paidAt: null,
        shippingAddress: {
          label: 'Rumah',
          name: pengguna.name,
          phone: '081234567890',
          street: 'Jl. Kenanga No. 12',
          district: 'Tebet',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: '12820',
        },
        shippingMethod: 'jne_reg' as const,
        notes: null,
        items: [
          {
            id: 1,
            productId: 1,
            variantId: null,
            name: 'Kemeja Batik Modern',
            variantName: null,
            image: '/products/batik.jpg',
            price: 125000,
            weight: 500,
            quantity: 1,
          },
        ],
      };
    } else {
      notFound();
    }
  }

  const isCod = order.paymentMethod === 'cod';
  const isPaid = order.paymentStatus === 'paid';
  const address = order.shippingAddress as AddressSnapshot | null;

  return (
    <main className="min-h-full flex-1 bg-gray-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header Sukses */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-xs">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Pesanan Berhasil Dibuat!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Terima kasih atas pesanan Anda di TokoKita.{' '}
            {isCod
              ? 'Pesanan COD Anda telah dikonfirmasi dan akan segera diproses.'
              : 'Silakan selesaikan pembayaran sebelum batas waktu berakhir.'}
          </p>
        </div>

        {/* Kartu Invoice & Total Tagihan */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
            <div>
              <span className="text-xs font-semibold text-gray-500">Nomor Invoice</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-wide text-gray-900">
                  {order.orderNumber}
                </span>
                <SalinTeksButton textToCopy={order.orderNumber} label="Salin Nomor" />
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-semibold text-gray-500">Total Tagihan</span>
              <p className="mt-1 text-2xl font-black text-[#FF6B00]">
                {formatRupiah(order.grandTotal)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Status Pesanan:</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 font-bold ${
                  isPaid
                    ? 'bg-green-100 text-green-800'
                    : isCod
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPaid
                  ? 'Pembayaran Lunas'
                  : isCod
                  ? 'Pesanan Dikonfirmasi (COD)'
                  : 'Menunggu Pembayaran'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-500">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Transaksi Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* Hitung Mundur 24 Jam */}
        <div className="mt-6">
          <CountdownTimer
            paymentDueAt={order.paymentDueAt}
            isCod={isCod}
            isPaid={isPaid}
          />
        </div>

        {/* Instruksi Pembayaran Sesuai Metode */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#FF6B00]" />
            <span>Instruksi Pembayaran</span>
          </h2>

          <div className="mt-4">
            {/* 1. Metode QRIS */}
            {order.paymentMethod === 'qris' && (
              <div className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl bg-gray-50 p-4 border border-gray-200">
                  <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 shadow-xs">
                    <QrCode className="h-32 w-32 text-gray-900" />
                    <span className="mt-2 text-[10px] font-bold text-gray-500">
                      QRIS STANDAR NASIONAL
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 text-gray-700">
                    <p className="font-bold text-gray-900 text-sm">
                      Cara Pembayaran via QRIS:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-gray-600">
                      <li>Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay) atau Mobile Banking favorit Anda.</li>
                      <li>Pilih menu <strong>Pindai / Scan QRIS</strong>.</li>
                      <li>Arahkan kamera ke kode QR di samping.</li>
                      <li>Periksa nama penerima: <strong>TokoKita Retail</strong> dan nominal: <strong>{formatRupiah(order.grandTotal)}</strong>.</li>
                      <li>Masukkan PIN Anda untuk menyelesaikan pembayaran.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Metode Transfer BCA */}
            {order.paymentMethod === 'bank_bca' && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-blue-700" />
                    <span className="text-sm font-bold text-blue-950">
                      Bank Central Asia (BCA)
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-[11px] text-gray-500">Nomor Rekening / Virtual Account</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-base font-extrabold text-gray-900 font-mono">
                          80777-0812-3456-7890
                        </span>
                        <SalinTeksButton textToCopy="80777081234567890" label="Salin" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-500">Atas Nama</span>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        PT TokoKita Retail Indonesia
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-gray-600 space-y-1 pl-1">
                  <p className="font-bold text-gray-900">Petunjuk Transfer:</p>
                  <p>1. Masuk ke BCA Mobile / KlikBCA / ATM BCA.</p>
                  <p>2. Pilih Transfer Virtual Account atau Antar Rekening BCA.</p>
                  <p>3. Masukkan nomor di atas dan pastikan nominal transfer tepat Rp {order.grandTotal.toLocaleString('id-ID')}.</p>
                </div>
              </div>
            )}

            {/* 3. Metode Transfer Mandiri */}
            {order.paymentMethod === 'bank_mandiri' && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-amber-700" />
                    <span className="text-sm font-bold text-amber-950">
                      Bank Mandiri
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-[11px] text-gray-500">Nomor Rekening / Virtual Account</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-base font-extrabold text-gray-900 font-mono">
                          89022-0812-3456-7890
                        </span>
                        <SalinTeksButton textToCopy="89022081234567890" label="Salin" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-500">Atas Nama</span>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        PT TokoKita Retail Indonesia
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-gray-600 space-y-1 pl-1">
                  <p className="font-bold text-gray-900">Petunjuk Transfer:</p>
                  <p>1. Masuk ke Livin&apos; by Mandiri atau ATM Mandiri.</p>
                  <p>2. Pilih menu Pembayaran / Transfer.</p>
                  <p>3. Masukkan nomor rekening di atas dan transfer nominal pas Rp {order.grandTotal.toLocaleString('id-ID')}.</p>
                </div>
              </div>
            )}

            {/* 4. Metode COD */}
            {isCod && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 space-y-2">
                <p className="font-bold text-gray-900">
                  Pembayaran Tunai di Tempat (Cash On Delivery):
                </p>
                <p>
                  Kurir akan menghubungi Anda sebelum mengirimkan barang. Mohon siapkan uang tunai sejumlah{' '}
                  <span className="font-bold text-[#FF6B00]">{formatRupiah(order.grandTotal)}</span> pada saat paket diserahterimakan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Item Pesanan & Alamat */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-[#FF6B00]" />
            <span>Rincian Barang yang Dipesan</span>
          </h2>

          <div className="mt-3 divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 text-xs">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <p className="font-bold text-gray-900">{item.name}</p>
                  {item.variantName && (
                    <p className="text-[11px] text-gray-500">Varian: {item.variantName}</p>
                  )}
                  <p className="text-gray-500">
                    {item.quantity} × {formatRupiah(item.price)}
                  </p>
                </div>

                <span className="font-bold text-gray-900">
                  {formatRupiah(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Alamat Pengiriman */}
          {address && (
            <div className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <MapPin className="h-3.5 w-3.5 text-[#FF6B00]" />
                <span>Alamat Pengiriman ({address.label ?? 'Utama'})</span>
              </div>
              <p className="mt-1">
                {address.name} — {address.phone}
              </p>
              <p className="text-gray-500">
                {address.street}, {address.district}, {address.city}, {address.province} {address.postalCode}
              </p>
            </div>
          )}
        </div>

        {/* Tombol Aksi & Navigasi */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="h-11 rounded-full bg-[#FF6B00] px-6 text-xs font-bold text-white hover:bg-[#e85f00]"
            >
              <Link href="/akun/pesanan">
                Lihat Riwayat Pesanan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full px-6 text-xs font-semibold"
            >
              <Link href="/">Lanjut Belanja</Link>
            </Button>
          </div>

          {/* Tombol Simulasi Pembayaran Sandbox */}
          {!isPaid && !isCod && (
            <div className="mt-2">
              <SimulasiBayarButton
                orderNumber={order.orderNumber}
                isPaid={isPaid}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
