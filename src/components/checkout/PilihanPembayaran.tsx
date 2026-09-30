"use client";

// Komponen Pilihan Metode Pembayaran Langkah 3 (PRD §3.2).
// Mendukung QRIS, Bank BCA, Bank Mandiri, dan COD dengan validasi aturan bisnis.

import {
  CheckCircle2,
  Circle,
  QrCode,
  Landmark,
  Banknote,
  AlertCircle,
  Info,
} from "lucide-react";
import type { KurirKode } from "@/lib/pesanan/ongkir";

export type MetodePembayaran = "qris" | "bank_bca" | "bank_mandiri" | "cod";

type Props = {
  grandTotal: number;
  selectedShippingMethod: KurirKode | null;
  selectedPaymentMethod: MetodePembayaran | null;
  onSelectPaymentMethod: (method: MetodePembayaran) => void;
};

export default function PilihanPembayaran({
  grandTotal,
  selectedShippingMethod,
  selectedPaymentMethod,
  onSelectPaymentMethod,
}: Props) {
  const isCodOverLimit = grandTotal > 2_000_000;
  const isCodInstantCourier = selectedShippingMethod === "gosend_instant";

  const getCodDisabledReason = (): string | null => {
    if (isCodOverLimit) {
      return "COD hanya berlaku untuk total belanja maksimal Rp 2.000.000";
    }
    if (isCodInstantCourier) {
      return "COD tidak tersedia untuk kurir instan (GoSend Instant)";
    }
    return null;
  };

  const codDisabledReason = getCodDisabledReason();

  const options: {
    id: MetodePembayaran;
    label: string;
    description: string;
    icon: typeof QrCode;
    disabled?: boolean;
    disabledReason?: string | null;
    instructions: string;
  }[] = [
    {
      id: "qris",
      label: "QRIS (GoPay, OVO, DANA, ShopeePay)",
      description: "Pembayaran instan melalui scan QR code standar nasional Indonesia. Berlaku 24 jam.",
      icon: QrCode,
      instructions:
        "Kode QRIS dinamis akan otomatis diterbitkan setelah Anda membuat pesanan. Siapkan aplikasi e-wallet atau mobile banking favorit Anda.",
    },
    {
      id: "bank_bca",
      label: "Transfer Bank BCA",
      description: "Transfer manual atau Virtual Account BCA. Konfirmasi otomatis/manual 24 jam.",
      icon: Landmark,
      instructions:
        "Nomor rekening dan Virtual Account BCA TokoKita akan ditampilkan pada halaman rincian pesanan berhasil.",
    },
    {
      id: "bank_mandiri",
      label: "Transfer Bank Mandiri",
      description: "Transfer ke rekening atau Virtual Account Mandiri. Berlaku 24 jam.",
      icon: Landmark,
      instructions:
        "Nomor rekening Mandiri TokoKita akan diterbitkan langsung setelah pesanan dibuat untuk memudahkan transaksi transfer Anda.",
    },
    {
      id: "cod",
      label: "Bayar di Tempat (COD)",
      description: "Bayar dengan uang tunai pas kepada kurir saat paket tiba di alamat Anda.",
      icon: Banknote,
      disabled: Boolean(codDisabledReason),
      disabledReason: codDisabledReason,
      instructions:
        "Pesanan COD akan langsung diproses dan dikonfirmasi penjual tanpa perlu transfer terlebih dahulu. Harap siapkan uang tunai saat kurir tiba.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-gray-900">
          Pilih Metode Pembayaran
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Seluruh transaksi di TokoKita aman dan terenkripsi. Pilih metode pembayaran yang paling nyaman untuk Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((opt) => {
          const isSelected = selectedPaymentMethod === opt.id;
          const Icon = opt.icon;

          return (
            <div
              key={opt.id}
              className={`relative overflow-hidden rounded-xl border transition-all ${
                opt.disabled
                  ? "cursor-not-allowed border-gray-200 bg-gray-50/70 opacity-60"
                  : isSelected
                  ? "border-[#FF6B00] bg-orange-50/20 shadow-xs"
                  : "cursor-pointer border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <button
                type="button"
                id={`payment-method-${opt.id}`}
                disabled={opt.disabled}
                onClick={() => onSelectPaymentMethod(opt.id)}
                className="flex w-full items-start gap-4 p-4 text-left"
              >
                <div className="mt-0.5 text-[#FF6B00]">
                  {opt.disabled ? (
                    <Circle className="h-5 w-5 text-gray-300" />
                  ) : isSelected ? (
                    <CheckCircle2 className="h-5 w-5 fill-[#FF6B00] text-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-bold text-gray-900">
                      {opt.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">{opt.description}</p>

                  {opt.disabled && opt.disabledReason && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {opt.disabledReason}
                    </p>
                  )}
                </div>
              </button>

              {isSelected && !opt.disabled && (
                <div className="border-t border-orange-100 bg-orange-50/40 px-4 py-2.5 text-xs text-orange-900">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6B00]" />
                    <span>{opt.instructions}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
