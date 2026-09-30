"use client";

// Dialog Konfirmasi Pesanan Diterima oleh Pembeli (PRD §10.6).

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, X, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { konfirmasiPesananDiterima } from "@/actions/pesanan";

type Props = {
  isOpen: boolean;
  orderNumber: string;
  isCod?: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function TerimaPesananDialog({
  isOpen,
  orderNumber,
  isCod,
  onClose,
  onSuccess,
}: Props) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleConfirm = () => {
    setErrorMessage(null);

    startTransition(async () => {
      const res = await konfirmasiPesananDiterima(orderNumber);
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Konfirmasi Pesanan Diterima</h3>
            <p className="text-xs text-gray-500 font-mono">{orderNumber}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-4 space-y-3 text-xs text-gray-600 leading-relaxed">
          <p>
            Pastikan barang pesanan Anda telah sampai dalam kondisi baik dan sesuai dengan pesanan Anda.
          </p>
          {isCod && (
            <p className="rounded-lg bg-blue-50 p-2.5 font-medium text-blue-800">
              Catatan: Status pembayaran COD akan otomatis ditandai sebagai <strong>Lunas</strong> setelah Anda menyelesaikan pesanan ini.
            </p>
          )}
          <p className="font-semibold text-gray-800">
            Setelah konfirmasi, status pesanan akan menjadi <strong>Selesai</strong> dan dana akan diteruskan ke penjual.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold"
          >
            Periksa Lagi
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="h-9 gap-1.5 bg-green-600 px-5 text-xs font-bold text-white hover:bg-green-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ya, Pesanan Diterima
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
