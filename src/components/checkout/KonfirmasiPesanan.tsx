"use client";

// Komponen Konfirmasi Pesanan Langkah 4 (PRD §3.3).
// Menampilkan tinjauan lengkap transaksi, catatan penjual, rincian biaya, dan tombol buat pesanan.

import Image from "next/image";
import {
  MapPin,
  Truck,
  CreditCard,
  QrCode,
  Landmark,
  Banknote,
  Package,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { Alamat } from "@/lib/data/alamat";
import type { KurirKode, OpsiPengiriman } from "@/lib/pesanan/ongkir";
import type { MetodePembayaran } from "./PilihanPembayaran";
import type { ItemKeranjang, AppliedPromo } from "@/stores/cart-store";
import type { PratinjauItem } from "@/actions/checkout";

type Props = {
  address: Alamat;
  shippingOptions: OpsiPengiriman[];
  selectedShippingMethod: KurirKode;
  selectedPaymentMethod: MetodePembayaran;
  items: ItemKeranjang[];
  pratinjauItems?: PratinjauItem[];
  subtotal: number;
  totalWeight: number;
  shippingCost: number;
  promo: AppliedPromo | null;
  discount: number;
  grandTotal: number;
  notes: string;
  onChangeNotes: (notes: string) => void;
  onGoToStep: (step: 1 | 2 | 3) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
};

export default function KonfirmasiPesanan({
  address,
  shippingOptions,
  selectedShippingMethod,
  selectedPaymentMethod,
  items,
  pratinjauItems,
  subtotal,
  totalWeight,
  shippingCost,
  promo,
  discount,
  grandTotal,
  notes,
  onChangeNotes,
  onGoToStep,
  errorMessage,
}: Props) {
  const kurirInfo = shippingOptions.find(
    (o) => o.method === selectedShippingMethod
  );

  const getPaymentLabel = (method: MetodePembayaran) => {
    switch (method) {
      case "qris":
        return {
          label: "QRIS (GoPay, OVO, DANA, ShopeePay)",
          icon: QrCode,
        };
      case "bank_bca":
        return {
          label: "Transfer Bank BCA",
          icon: Landmark,
        };
      case "bank_mandiri":
        return {
          label: "Transfer Bank Mandiri",
          icon: Landmark,
        };
      case "cod":
        return {
          label: "Bayar di Tempat (COD)",
          icon: Banknote,
        };
      default:
        return {
          label: "Metode Pembayaran",
          icon: CreditCard,
        };
    }
  };

  const paymentInfo = getPaymentLabel(selectedPaymentMethod);
  const PaymentIcon = paymentInfo.icon;

  // Gabungkan info tampilan item dengan pratinjau server terkini
  const mergedItems = items.map((cartItem) => {
    const preview = pratinjauItems?.find(
      (p) =>
        p.productId === cartItem.productId && p.variantId === cartItem.variantId
    );
    return {
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      name: preview?.name ?? cartItem.name,
      variantName: preview?.variantName ?? cartItem.variantName,
      image: preview?.image ?? cartItem.image,
      price: preview?.price ?? cartItem.price,
      quantity: cartItem.quantity,
      subtotal: (preview?.price ?? cartItem.price) * cartItem.quantity,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground">
          Tinjau & Konfirmasi Pesanan
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Silakan periksa kembali rincian alamat pengiriman, kurir, dan metode pembayaran Anda sebelum membuat pesanan.
        </p>
      </div>

      {/* Pesan Error Jika Ada */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="flex-1">
            <span className="font-bold">Gagal Membuat Pesanan: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Grid 3 Kartu Ringkasan (Alamat, Kurir, Pembayaran) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 1. Alamat Pengiriman */}
        <div className="relative rounded-3xl bg-tile p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <MapPin className="h-3.5 w-3.5 text-foreground" />
              <span>Alamat Pengiriman</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Ubah
            </button>
          </div>
          <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">
              {address.name}{" "}
              <span className="font-normal text-muted-foreground">({address.label})</span>
            </p>
            <p className="text-muted-foreground">{address.phone}</p>
            <p className="line-clamp-2">
              {address.street}, {address.district}, {address.city},{" "}
              {address.province} {address.postalCode}
            </p>
          </div>
        </div>

        {/* 2. Pengiriman & Kurir */}
        <div className="relative rounded-3xl bg-tile p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Truck className="h-3.5 w-3.5 text-foreground" />
              <span>Pengiriman</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Ubah
            </button>
          </div>
          <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">
              {kurirInfo?.label ?? selectedShippingMethod}
            </p>
            <p className="text-muted-foreground">
              Estimasi tiba: {kurirInfo?.estimate ?? "-"}
            </p>
            <p className="text-muted-foreground">
              Berat total: {totalWeight.toLocaleString("id-ID")} gram
            </p>
          </div>
        </div>

        {/* 3. Metode Pembayaran */}
        <div className="relative rounded-3xl bg-tile p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <PaymentIcon className="h-3.5 w-3.5 text-foreground" />
              <span>Pembayaran</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Ubah
            </button>
          </div>
          <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">{paymentInfo.label}</p>
            {selectedPaymentMethod === "cod" ? (
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                Bayar tunai kepada kurir saat pesanan sampai
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Batas waktu pembayaran 24 jam setelah pesanan dibuat
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Daftar Barang yang Dipesan */}
      <div className="rounded-3xl bg-tile p-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Package className="h-4 w-4 text-foreground" />
          <h4 className="text-xs font-bold text-foreground">
            Daftar Produk ({items.reduce((acc, i) => acc + i.quantity, 0)} barang)
          </h4>
        </div>

        <div className="divide-y divide-border">
          {mergedItems.map((item, idx) => (
            <div
              key={`${item.productId}-${item.variantId ?? idx}`}
              className="flex items-center gap-4 py-3 text-xs"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
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

              <div className="flex-1 space-y-0.5">
                <p className="font-bold text-foreground line-clamp-1">
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
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Catatan untuk Penjual */}
      <div className="rounded-3xl bg-tile p-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="order-notes"
            className="flex items-center gap-2 text-xs font-bold text-foreground"
          >
            <FileText className="h-3.5 w-3.5 text-foreground" />
            <span>Catatan untuk Penjual (Opsional)</span>
          </label>
          <span className="text-[11px] text-muted-foreground/70">
            {notes.length}/500
          </span>
        </div>
        <textarea
          id="order-notes"
          value={notes}
          maxLength={500}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Contoh: Tolong bungkus ekstra bubble wrap, warna hitam jika ada"
          rows={3}
          className="mt-2.5 w-full rounded-lg border border-border p-3 text-xs placeholder:text-muted-foreground/70 focus:border-foreground focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>

      {/* 6. Rincian Biaya */}
      <div className="rounded-3xl bg-tile p-4">
        <h4 className="border-b border-border pb-2 text-xs font-bold text-foreground">
          Rincian Pembayaran
        </h4>
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal Produk</span>
            <span className="font-semibold text-foreground">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Biaya Pengiriman ({kurirInfo?.label ?? selectedShippingMethod})</span>
            <span className="font-semibold text-foreground">
              {formatRupiah(shippingCost)}
            </span>
          </div>

          {promo && discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Promo ({promo.code})</span>
              <span className="font-semibold">-{formatRupiah(discount)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="font-bold text-foreground">Total Tagihan</span>
            <span className="text-base font-extrabold text-foreground">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
