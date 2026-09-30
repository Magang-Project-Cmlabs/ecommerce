"use client";

// Dialog Konfirmasi Pembatalan Pesanan oleh Pembeli (PRD §10.6).

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { batalkanPesanan } from "@/actions/pesanan";

type Props = {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
  onSuccess: () => void;
};

const PILIHAN_ALASAN = [
  "Ingin mengubah alamat pengiriman",
  "Ingin mengganti produk atau varian",
  "Menemukan promo atau harga lebih murah",
  "Berubah pikiran / tidak jadi membeli",
  "Lainnya",
];

export default function BatalkanDialog({
  isOpen,
  orderNumber,
  onClose,
  onSuccess,
}: Props) {
  const [alasanPilihan, setAlasanPilihan] = useState(PILIHAN_ALASAN[0]);
  const [alasanKustom, setAlasanKustom] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const alasanAkhir =
      (alasanPilihan === "Lainnya"
        ? alasanKustom.trim()
        : alasanPilihan) || "Dibatalkan oleh pembeli";

    startTransition(async () => {
      const res = await batalkanPesanan(orderNumber, alasanAkhir);
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Tutup dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Batalkan Pesanan</h3>
            <p className="text-xs text-gray-500 font-mono">{orderNumber}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Apakah Anda yakin ingin membatalkan pesanan ini? Stok barang dan kuota kode promo akan dikembalikan otomatis.
          </p>

          <div>
            <Label htmlFor="alasan-batal" className="text-xs font-semibold text-gray-700">
              Pilih Alasan Pembatalan:
            </Label>
            <select
              id="alasan-batal"
              value={alasanPilihan}
              disabled={isPending}
              onChange={(e) => setAlasanPilihan(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-800 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-none"
            >
              {PILIHAN_ALASAN.map((alasan) => (
                <option key={alasan} value={alasan}>
                  {alasan}
                </option>
              ))}
            </select>
          </div>

          {alasanPilihan === "Lainnya" && (
            <div>
              <Label htmlFor="alasan-kustom" className="text-xs font-semibold text-gray-700">
                Tulis Alasan Lain:
              </Label>
              <textarea
                id="alasan-kustom"
                value={alasanKustom}
                disabled={isPending}
                maxLength={200}
                onChange={(e) => setAlasanKustom(e.target.value)}
                placeholder="Tuliskan alasan pembatalan Anda..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-none"
              />
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold"
            >
              Tidak Jadi
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              className="h-9 gap-1.5 px-4 text-xs font-bold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Membatalkan...
                </>
              ) : (
                "Ya, Batalkan Pesanan"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
