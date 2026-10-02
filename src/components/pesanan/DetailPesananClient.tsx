"use client";

// Komponen Client Detail Pesanan Pembeli (PRD §7.7, §10.6).
// Menampilkan timeline riwayat status, nomor resi kurir, rincian produk, dan tombol aksi (Bayar, Batalkan, Terima).

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatTanggalWIB } from "@/lib/format";
import {
  LABEL_STATUS_PESANAN,
  LABEL_STATUS_PEMBAYARAN,
  type OrderStatus,
} from "@/lib/pesanan/status";
import type { DetailPesananLengkap } from "@/lib/data/pesanan";
import SalinTeksButton from "@/components/checkout/SalinTeksButton";
import CountdownTimer from "@/components/checkout/CountdownTimer";
import BatalkanDialog from "./BatalkanDialog";
import TerimaPesananDialog from "./TerimaPesananDialog";
import PaymentControls from '@/components/checkout/PaymentControls';

type Props = {
  order: DetailPesananLengkap;
  gatewayEnabled: boolean;
  sandbox: boolean;
  simulationEnabled: boolean;
};

export default function DetailPesananClient({ order, gatewayEnabled, sandbox, simulationEnabled }: Props) {
  const router = useRouter();

  // State Dialog Aksi
  const [showBatalDialog, setShowBatalDialog] = useState(false);
  const [showTerimaDialog, setShowTerimaDialog] = useState(false);

  const isPending = order.status === "pending";
  const isShipped = order.status === "shipped";
  const isCod = order.paymentMethod === "cod";
  const isPaid = order.paymentStatus === "paid";

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "packed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Tombol Kembali ke Daftar Pesanan */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 -ml-2 gap-1.5 text-xs text-gray-600 hover:text-gray-900"
        >
          <Link href="/akun/pesanan">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Riwayat Pesanan
          </Link>
        </Button>
      </div>

      {/* Header Rincian Pesanan */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Nomor Pesanan</span>
              <SalinTeksButton textToCopy={order.orderNumber} label="Salin" />
            </div>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl font-mono">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Dipesan pada {formatTanggalWIB(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                order.status
              )}`}
            >
              {LABEL_STATUS_PESANAN[order.status]}
            </span>

            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                isPaid
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {LABEL_STATUS_PEMBAYARAN[order.paymentStatus]}
            </span>
          </div>
        </div>

        {/* Tombol Aksi Utama */}
        {(isPending || isShipped) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-50/50 p-4 border border-orange-100">
            <div className="text-xs text-gray-700">
              {isPending && (
                <span>Pesanan menunggu penyelesaian pembayaran sebelum diproses oleh toko.</span>
              )}
              {isShipped && (
                <span>Paket sedang dalam perjalanan. Klik tombol setelah Anda menerima dan memeriksa paket.</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isPending && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBatalDialog(true)}
                    className="h-9 gap-1.5 rounded-full border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    Batalkan Pesanan
                  </Button>

                  <PaymentControls orderNumber={order.orderNumber} gatewayEnabled={gatewayEnabled} sandbox={sandbox} simulationEnabled={simulationEnabled} />
                </>
              )}

              {isShipped && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowTerimaDialog(true)}
                  className="h-9 gap-1.5 rounded-full bg-green-600 px-5 text-xs font-bold text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Pesanan Diterima
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Hitung Mundur Batas Bayar Jika Pending Non-COD */}
        {isPending && !isCod && (
          <div className="mt-4">
            <CountdownTimer
              paymentDueAt={order.paymentDueAt}
              isCod={isCod}
              isPaid={isPaid}
            />
          </div>
        )}
      </div>

      {/* Grid 2 Kolom: Pengiriman & Resi (Kiri), Riwayat Status Timeline (Kanan) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Informasi Pengiriman & Resi */}
        <div className="space-y-6 lg:col-span-7">
          {/* Kartu Informasi Kurir & Resi */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              <Truck className="h-4 w-4 text-orange-700" />
              <span>Informasi Pengiriman</span>
            </h2>

            {/* Nomor Resi Jika Ada */}
            {order.trackingNumber ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-950">
                <span className="font-semibold text-blue-800">Nomor Resi Pelacakan:</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-base font-extrabold tracking-wider font-mono text-blue-900">
                    {order.trackingNumber}
                  </span>
                  <SalinTeksButton textToCopy={order.trackingNumber} label="Salin Resi" />
                </div>
                <p className="mt-1 text-[11px] text-blue-700">
                  Layanan: <strong className="uppercase">{order.shippingMethod.replace('_', ' ')}</strong>
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-600">
                <p className="font-medium text-gray-800">Nomor Resi Belum Diterbitkan</p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Admin akan memasukkan nomor resi saat pesanan dikirim.
                </p>
              </div>
            )}

            {/* Alamat Pengiriman */}
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <MapPin className="h-3.5 w-3.5 text-orange-700" />
                <span>Alamat Tujuan ({order.shippingAddress?.label ?? 'Utama'})</span>
              </div>
              <p className="font-semibold text-gray-800">
                {order.shippingAddress?.name} — {order.shippingAddress?.phone}
              </p>
              <p className="text-gray-500">
                {order.shippingAddress?.street}, {order.shippingAddress?.district},{" "}
                {order.shippingAddress?.city}, {order.shippingAddress?.province}{" "}
                {order.shippingAddress?.postalCode}
              </p>
            </div>
          </div>

          {/* Kartu Daftar Barang */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              <Package className="h-4 w-4 text-orange-700" />
              <span>Daftar Produk ({order.items.reduce((acc, i) => acc + i.quantity, 0)} barang)</span>
            </h2>

            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 text-xs">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {order.status === 'delivered' && item.productSlug && <Link href={`/produk/${item.productSlug}#ulasan`} className="inline-flex min-h-11 items-center text-sm font-semibold text-secondary underline">Beri Ulasan</Link>}
                    {item.variantName && (
                      <p className="text-[11px] text-gray-500">Varian: {item.variantName}</p>
                    )}
                    <p className="text-gray-500">
                      {item.quantity} × {formatRupiah(item.price)}
                    </p>
                  </div>

                  <div className="text-right font-bold text-gray-900">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Catatan Penjual */}
            {order.notes && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                <span className="font-bold text-gray-900">Catatan untuk Penjual: </span>
                <span>{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Timeline Riwayat Status & Rincian Biaya */}
        <div className="space-y-6 lg:col-span-5">
          {/* Timeline Riwayat Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              <Clock className="h-4 w-4 text-orange-700" />
              <span>Riwayat Status Pesanan</span>
            </h2>

            <div className="relative mt-4 pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {order.statusLogs.map((log, index) => {
                const isLatest = index === 0;

                return (
                  <div key={log.id} className="relative mb-5 last:mb-0">
                    {/* Bullet Titik Timeline */}
                    <div
                      className={`absolute -left-4 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                        isLatest
                          ? "bg-orange-700 ring-orange-100"
                          : "bg-gray-300"
                      }`}
                    />

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isLatest ? "text-gray-900" : "text-gray-600"
                          }`}
                        >
                          {LABEL_STATUS_PESANAN[log.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {formatTanggalWIB(log.createdAt)}
                      </p>
                      {log.note && (
                        <p className="mt-0.5 text-xs text-gray-700">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rincian Biaya Pembayaran */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Rincian Pembayaran
            </h2>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Metode Pembayaran</span>
                <span className="font-semibold text-gray-900 uppercase">
                  {order.paymentMethod.replace('_', ' ')}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(order.shippingCost)}
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon Promo</span>
                  <span className="font-semibold">-{formatRupiah(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-extrabold text-gray-900">
                <span>Total Tagihan</span>
                <span className="text-base text-orange-700">
                  {formatRupiah(order.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Konfirmasi Pembatalan */}
      <BatalkanDialog
        isOpen={showBatalDialog}
        orderNumber={order.orderNumber}
        onClose={() => setShowBatalDialog(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Dialog Konfirmasi Pesanan Diterima */}
      <TerimaPesananDialog
        isOpen={showTerimaDialog}
        orderNumber={order.orderNumber}
        isCod={isCod}
        onClose={() => setShowTerimaDialog(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
