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
import type { OrderStatus } from "@/lib/pesanan/status";
import type { PesananRingkas } from "@/lib/data/pesanan";
import BatalkanDialog from "./BatalkanDialog";
import TerimaPesananDialog from "./TerimaPesananDialog";
import { LencanaPembayaran, LencanaStatus } from '@/components/pesanan/Lencana';

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


  return (
    <div className="space-y-6">
      {/* Tab Filter Status Pesanan */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border pb-2">
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
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? "bg-background/25 text-background"
                      : "bg-muted text-foreground/80"
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
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-background">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/70 stroke-1" />
          <h3 className="mt-4 text-base font-bold text-foreground">
            Tidak Ada Pesanan
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
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
                className="overflow-hidden rounded-3xl bg-tile transition-hover hover:border-border"
              >
                {/* Header Kartu Pesanan */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-extrabold text-foreground font-mono tracking-tight">
                      {order.orderNumber}
                    </span>
                    <span className="text-muted-foreground/70">•</span>
                    <span className="text-muted-foreground">
                      {formatTanggalWIB(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <LencanaStatus status={order.status} />

                    <LencanaPembayaran status={order.paymentStatus} />
                  </div>
                </div>

                {/* Daftar Produk di Pesanan */}
                <div className="divide-y divide-border px-5 py-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-2.5 text-xs"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-background">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/70">
                            <Package className="h-6 w-6 stroke-1" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate font-bold text-foreground">
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p className="text-[11px] text-muted-foreground">
                            Varian: {item.variantName}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          {item.quantity} × {formatRupiah(item.price)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-foreground">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Kartu Pesanan: Total & Tombol Aksi */}
                <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Total Pembayaran: </span>
                    <span className="text-sm font-extrabold text-foreground">
                      {formatRupiah(order.grandTotal)}
                    </span>
                    {order.trackingNumber && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                        No. Resi: <strong className="text-foreground">{order.trackingNumber}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tombol Detail Pesanan */}
                    <Button
                      asChild
                      variant="outline"
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
