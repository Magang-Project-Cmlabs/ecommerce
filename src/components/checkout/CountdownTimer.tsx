"use client";

// Komponen Hitung Mundur Batas Bayar 24 Jam (PRD §4.2 angka 3).
// Mendukung pembaruan detik-per-detik, kartu digital, dan peringatan warna.

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, Banknote } from "lucide-react";

type Props = {
  paymentDueAt: Date | string | null;
  isCod?: boolean;
  isPaid?: boolean;
};

export default function CountdownTimer({
  paymentDueAt,
  isCod,
  isPaid,
}: Props) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isExpired: boolean;
  }>({
    hours: 24,
    minutes: 0,
    seconds: 0,
    totalSeconds: 86400,
    isExpired: false,
  });

  useEffect(() => {
    if (!paymentDueAt || isCod || isPaid) return;

    const dueTime = new Date(paymentDueAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = dueTime - now;

      if (diffMs <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: true,
        });
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        totalSeconds: totalSec,
        isExpired: false,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentDueAt, isCod, isPaid]);

  if (isPaid) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-900">
        <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="font-bold">Pembayaran Telah Selesai</p>
          <p className="text-green-700">
            Terima kasih! Pesanan Anda sedang dipersiapkan oleh toko untuk segera dikirim.
          </p>
        </div>
      </div>
    );
  }

  if (isCod) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <Banknote className="h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="font-bold">Metode Bayar di Tempat (COD)</p>
          <p className="text-blue-700">
            Harap siapkan uang tunai pas saat kurir mengantarkan paket ke alamat Anda.
          </p>
        </div>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
        <div>
          <p className="font-bold">Batas Waktu Pembayaran Telah Habis</p>
          <p className="text-red-700">
            Waktu pembayaran telah berakhir. Pesanan akan dibatalkan otomatis oleh sistem.
          </p>
        </div>
      </div>
    );
  }

  // Peringatan warna: merah berkedip lembut jika < 2 jam (7200 detik), hijau/netral jika > 6 jam
  const isUrgent = timeLeft.totalSeconds < 7200;

  return (
    <div
      className={`rounded-xl border p-4 text-center transition-colors ${
        isUrgent
          ? "border-red-300 bg-red-50/70"
          : "border-orange-200 bg-orange-50/40"
      }`}
    >
      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700">
        <Clock
          className={`h-4 w-4 ${
            isUrgent ? "animate-pulse text-red-600" : "text-orange-700"
          }`}
        />
        <span>Selesaikan pembayaran dalam waktu:</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {/* Kotak Jam */}
        <div className="flex flex-col items-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-extrabold shadow-xs ${
              isUrgent
                ? "bg-red-600 text-white animate-pulse"
                : "bg-gray-900 text-white"
            }`}
          >
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <span className="mt-1 text-[10px] font-semibold text-gray-500 uppercase">
            Jam
          </span>
        </div>

        <span className="text-xl font-bold text-gray-400 pb-4">:</span>

        {/* Kotak Menit */}
        <div className="flex flex-col items-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-extrabold shadow-xs ${
              isUrgent
                ? "bg-red-600 text-white animate-pulse"
                : "bg-gray-900 text-white"
            }`}
          >
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <span className="mt-1 text-[10px] font-semibold text-gray-500 uppercase">
            Menit
          </span>
        </div>

        <span className="text-xl font-bold text-gray-400 pb-4">:</span>

        {/* Kotak Detik */}
        <div className="flex flex-col items-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-extrabold shadow-xs ${
              isUrgent
                ? "bg-red-600 text-white animate-pulse"
                : "bg-gray-900 text-white"
            }`}
          >
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <span className="mt-1 text-[10px] font-semibold text-gray-500 uppercase">
            Detik
          </span>
        </div>
      </div>

      {isUrgent && (
        <p className="mt-2 text-[11px] font-medium text-red-600">
          Waktu pembayaran tersisa kurang dari 2 jam! Segera selesaikan transaksi.
        </p>
      )}
    </div>
  );
}
