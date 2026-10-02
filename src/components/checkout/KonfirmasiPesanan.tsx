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
        <h3 className="text-base font-bold text-gray-900">
          Tinjau & Konfirmasi Pesanan
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Silakan periksa kembali rincian alamat pengiriman, kurir, dan metode pembayaran Anda sebelum membuat pesanan.
        </p>
      </div>

      {/* Pesan Error Jika Ada */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
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
        <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <MapPin className="h-3.5 w-3.5 text-orange-700" />
              <span>Alamat Pengiriman</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs font-semibold text-orange-700 underline-offset-4 hover:underline"
            >
              Ubah
            </button>
          </div>
          <div className="mt-2.5 space-y-1 text-xs text-gray-600">
            <p className="font-bold text-gray-900">
              {address.name}{" "}
              <span className="font-normal text-gray-500">({address.label})</span>
            </p>
            <p className="text-gray-500">{address.phone}</p>
            <p className="line-clamp-2">
              {address.street}, {address.district}, {address.city},{" "}
              {address.province} {address.postalCode}
            </p>
          </div>
        </div>

        {/* 2. Pengiriman & Kurir */}
        <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Truck className="h-3.5 w-3.5 text-orange-700" />
              <span>Pengiriman</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="text-xs font-semibold text-orange-700 underline-offset-4 hover:underline"
            >
              Ubah
            </button>
          </div>
          <div className="mt-2.5 space-y-1 text-xs text-gray-600">
            <p className="font-bold text-gray-900">
              {kurirInfo?.label ?? selectedShippingMethod}
            </p>
            <p className="text-gray-500">
              Estimasi tiba: {kurirInfo?.estimate ?? "-"}
            </p>
            <p className="text-gray-500">
              Berat total: {totalWeight.toLocaleString("id-ID")} gram
            </p>
          </div>
        </div>

        {/* 3. Metode Pembayaran */}
        <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <PaymentIcon className="h-3.5 w-3.5 text-orange-700" />
              <span>Pembayaran</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="text-xs font-semibold text-orange-700 underline-offset-4 hover:underline"
            >
              Ubah
            </button>
          </div>
          <div className="mt-2.5 space-y-1 text-xs text-gray-600">
            <p className="font-bold text-gray-900">{paymentInfo.label}</p>
            {selectedPaymentMethod === "cod" ? (
              <p className="text-[11px] font-medium text-amber-700">
                Bayar tunai kepada kurir saat pesanan sampai
              </p>
            ) : (
              <p className="text-[11px] text-gray-500">
                Batas waktu pembayaran 24 jam setelah pesanan dibuat
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Daftar Barang yang Dipesan */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Package className="h-4 w-4 text-orange-700" />
          <h4 className="text-xs font-bold text-gray-900">
            Daftar Produk ({items.reduce((acc, i) => acc + i.quantity, 0)} barang)
          </h4>
        </div>

        <div className="divide-y divide-gray-100">
          {mergedItems.map((item, idx) => (
            <div
              key={`${item.productId}-${item.variantId ?? idx}`}
              className="flex items-center gap-4 py-3 text-xs"
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

              <div className="flex-1 space-y-0.5">
                <p className="font-bold text-gray-900 line-clamp-1">
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
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Catatan untuk Penjual */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <label
            htmlFor="order-notes"
            className="flex items-center gap-2 text-xs font-bold text-gray-900"
          >
            <FileText className="h-3.5 w-3.5 text-orange-700" />
            <span>Catatan untuk Penjual (Opsional)</span>
          </label>
          <span className="text-[11px] text-gray-400">
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
          className="mt-2.5 w-full rounded-lg border border-gray-200 p-3 text-xs placeholder:text-gray-400 focus:border-orange-700 focus:ring-1 focus:ring-orange-700 focus:outline-none"
        />
      </div>

      {/* 6. Rincian Biaya */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <h4 className="border-b border-gray-100 pb-2 text-xs font-bold text-gray-900">
          Rincian Pembayaran
        </h4>
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Produk</span>
            <span className="font-semibold text-gray-900">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Biaya Pengiriman ({kurirInfo?.label ?? selectedShippingMethod})</span>
            <span className="font-semibold text-gray-900">
              {formatRupiah(shippingCost)}
            </span>
          </div>

          {promo && discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Promo ({promo.code})</span>
              <span className="font-semibold">-{formatRupiah(discount)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="font-bold text-gray-900">Total Tagihan</span>
            <span className="text-base font-extrabold text-orange-700">
              {formatRupiah(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
