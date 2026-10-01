"use client";

// Tombol Simulasi Pembayaran Sandbox (PRD §4.2 angka 5).
// Memungkinkan pengujian alur status bayar tanpa menunggu webhook Midtrans asli.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulasiBayarPesanan } from "@/actions/checkout";

type Props = {
  orderNumber: string;
  isPaid: boolean;
};

export default function SimulasiBayarButton({ orderNumber, isPaid }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPaid || success) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
        <Check className="h-4 w-4 text-green-600" />
        <span>Status: Lunas (Terverifikasi)</span>
      </div>
    );
  }

  const handleSimulasi = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await simulasiBayarPesanan(orderNumber);
      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(res.message);
      }
    } catch {
      setError("Gagal menghubungkan ke server simulasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={handleSimulasi}
        className="h-10 gap-2 rounded-full border-dashed border-amber-400 bg-amber-50/60 px-5 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 hover:text-amber-950"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
        ) : (
          <Sparkles className="h-4 w-4 text-amber-600" />
        )}
        <span>Simulasi Konfirmasi Bayar (Sandbox)</span>
      </Button>

      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
