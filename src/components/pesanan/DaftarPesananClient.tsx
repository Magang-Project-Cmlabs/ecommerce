"use client";

// Komponen Client Daftar Riwayat Pesanan Pembeli (PRD §7.7, §10.6).
// Menyediakan filter status, kartu pesanan interaktif, dan tombol aksi (Bayar, Batalkan, Pesanan Diterima).

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  XCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatTanggalWIB } from "@/lib/format";
import {
  LABEL_STATUS_PESANAN,
  LABEL_STATUS_PEMBAYARAN,
  type OrderStatus,
} from "@/lib/pesanan/status";
import type { PesananRingkas } from "@/lib/data/pesanan";
import BatalkanDialog from "./BatalkanDialog";
import TerimaPesananDialog from "./TerimaPesananDialog";

type Props = {
  orders: PesananRingkas[];
};

type FilterTab = "semua" | OrderStatus;

const TABS: { id: FilterTab; label: string }[] = [
  { id: "semua", label: "Semua Pesanan" },
  { id: "pending", label: "Menunggu Pembayaran" },
  { id: "confirmed", label: "Dikonfirmasi" },
  { id: "packed", label: "Dikemas" },
  { id: "shipped", label: "Dikirim" },
  { id: "delivered", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
];

export default function DaftarPesananClient({ orders }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("semua");

  // State Dialog Aksi
  const [batalOrderNumber, setBatalOrderNumber] = useState<string | null>(null);
  const [terimaOrder, setTerimaOrder] = useState<{
    orderNumber: string;
    isCod: boolean;
  } | null>(null);

  // Filter pesanan sesuai tab aktif
  const filteredOrders =
    activeTab === "semua"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  // Hitung jumlah item per status tab
  const getTabCount = (tabId: FilterTab): number => {
    if (tabId === "semua") return orders.length;
    return orders.filter((o) => o.status === tabId).length;
  };

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

  const getPaymentBadgeClass = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "refunded":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Filter Status Pesanan */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-orange-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? "bg-white/30 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Konten Daftar Pesanan */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center bg-white">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 stroke-1" />
          <h3 className="mt-4 text-base font-bold text-gray-900">
            Tidak Ada Pesanan
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {activeTab === "semua"
              ? "Anda belum pernah melakukan pemesanan di TokoKita."
              : `Tidak ada pesanan dengan status "${TABS.find((t) => t.id === activeTab)?.label}".`}
          </p>
          <Button
            asChild
            className="mt-6"
          >
            <Link href="/">
              Mulai Belanja Sekarang
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === "pending";
            const isShipped = order.status === "shipped";
            const isCod = order.paymentMethod === "cod";

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-hover hover:border-gray-300"
              >
                {/* Header Kartu Pesanan */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-extrabold text-gray-900 font-mono tracking-tight">
                      {order.orderNumber}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {formatTanggalWIB(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {LABEL_STATUS_PESANAN[order.status]}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPaymentBadgeClass(
                        order.paymentStatus
                      )}`}
                    >
                      {LABEL_STATUS_PEMBAYARAN[order.paymentStatus]}
                    </span>
                  </div>
                </div>

                {/* Daftar Produk di Pesanan */}
                <div className="divide-y divide-gray-100 px-5 py-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-2.5 text-xs"
                    >
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
                            <Package className="h-6 w-6 stroke-1" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate font-bold text-gray-900">
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p className="text-[11px] text-gray-500">
                            Varian: {item.variantName}
                          </p>
                        )}
                        <p className="text-gray-500">
                          {item.quantity} × {formatRupiah(item.price)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-gray-900">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Kartu Pesanan: Total & Tombol Aksi */}
                <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/30 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs">
                    <span className="text-gray-500">Total Pembayaran: </span>
                    <span className="text-sm font-extrabold text-orange-700">
                      {formatRupiah(order.grandTotal)}
                    </span>
                    {order.trackingNumber && (
                      <p className="mt-0.5 text-[11px] text-gray-500 font-mono">
                        No. Resi: <strong className="text-gray-800">{order.trackingNumber}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tombol Detail Pesanan */}
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                    >
                      <Link href={`/akun/pesanan/${order.orderNumber}`}>
                        Detail Pesanan
                        <ChevronRight aria-hidden />
                      </Link>
                    </Button>

                    {/* Tombol Aksi: Batalkan Pesanan (Hanya jika pending) */}
                    {isPending && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setBatalOrderNumber(order.orderNumber)}
                      >
                        <XCircle aria-hidden />
                        Batalkan
                      </Button>
                    )}

                    {/* Tombol Aksi: Bayar Sekarang (Hanya jika pending) */}
                    {isPending && (
                      <Button
                        asChild
                        size="sm"
                      >
                        <Link href={`/checkout/berhasil/${order.orderNumber}`}>
                          <CreditCard className="h-3.5 w-3.5" />
                          Bayar Sekarang
                        </Link>
                      </Button>
                    )}

                    {/* Tombol Aksi: Pesanan Diterima (Hanya jika shipped) */}
                    {isShipped && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          setTerimaOrder({
                            orderNumber: order.orderNumber,
                            isCod,
                          })
                        }
                        className="h-8 gap-1.5 rounded-full bg-green-600 px-4 text-xs font-bold text-white hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pesanan Diterima
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Konfirmasi Pembatalan */}
      <BatalkanDialog
        isOpen={Boolean(batalOrderNumber)}
        orderNumber={batalOrderNumber ?? ""}
        onClose={() => setBatalOrderNumber(null)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Dialog Konfirmasi Pesanan Diterima */}
      <TerimaPesananDialog
        isOpen={Boolean(terimaOrder)}
        orderNumber={terimaOrder?.orderNumber ?? ""}
        isCod={terimaOrder?.isCod}
        onClose={() => setTerimaOrder(null)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
