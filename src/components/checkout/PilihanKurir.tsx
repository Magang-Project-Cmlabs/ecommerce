"use client";

import { CheckCircle2, Circle, Clock, Package, Truck, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { Alamat } from "@/lib/data/alamat";
import type { KurirKode, OpsiPengiriman } from "@/lib/pesanan/ongkir";
import { hitungBeratKg } from "@/lib/pesanan/ongkir";

type Props = {
  address: Alamat;
  totalWeight: number;
  shippingOptions: OpsiPengiriman[];
  selectedMethod: KurirKode | null;
  onSelectMethod: (method: KurirKode) => void;
  onBackToAddress: () => void;
};

export default function PilihanKurir({
  address,
  totalWeight,
  shippingOptions,
  selectedMethod,
  onSelectMethod,
  onBackToAddress,
}: Props) {
  const beratKg = hitungBeratKg(totalWeight);

  return (
    <div className="space-y-5">
      {/* Ringkasan Alamat Tujuan */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-gray-500">
              Dikirim ke:
            </span>
            <p className="font-bold text-gray-900">
              {address.name} ({address.label}) —{" "}
              <span className="font-normal text-gray-600">{address.phone}</span>
            </p>
            <p className="text-gray-600">
              {address.street}, {address.district}, {address.city},{" "}
              {address.province} {address.postalCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToAddress}
            className="text-xs font-semibold text-orange-700 underline-offset-4 hover:underline"
          >
            Ubah
          </button>
        </div>
      </div>

      {/* Informasi Berat Barang */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-900">
        <Package className="h-5 w-5 shrink-0 text-blue-600" />
        <div className="flex-1">
          <span className="font-bold">Total Berat Belanjaan: </span>
          <span>
            {totalWeight.toLocaleString("id-ID")} gram (dihitung {beratKg} kg)
          </span>
          <p className="mt-0.5 text-[11px] text-blue-700">
            Tarif pengiriman dihitung per kilogram pembulatan ke atas sesuai aturan ekspedisi.
          </p>
        </div>
      </div>

      {/* Pilihan Kurir */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900">
          Pilih Layanan Pengiriman
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {shippingOptions.map((opsi) => {
            const isSelected = selectedMethod === opsi.method;
            const isDisabled = !opsi.available;

            return (
              <button
                key={opsi.method}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectMethod(opsi.method)}
                className={`relative flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                  isDisabled
                    ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                    : isSelected
                    ? "cursor-pointer border-orange-700 bg-orange-50/30 shadow-xs"
                    : "cursor-pointer border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-orange-700">
                    {isDisabled ? (
                      <Circle className="h-5 w-5 text-gray-300" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-5 w-5 fill-orange-700 text-white" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-bold text-gray-900">
                        {opsi.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Estimasi tiba: {opsi.estimate}</span>
                    </div>

                    {isDisabled && opsi.reason && (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <AlertCircle className="h-3 w-3" />
                        {opsi.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {formatRupiah(opsi.cost)}
                  </span>
                  {opsi.method === "gosend_instant" ? (
                    <p className="text-[10px] text-gray-500">Tarif flat instan</p>
                  ) : (
                    <p className="text-[10px] text-gray-500">
                      {formatRupiah(opsi.cost / beratKg)} / kg
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
