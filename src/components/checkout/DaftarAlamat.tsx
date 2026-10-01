"use client";

import { useState } from "react";
import { CheckCircle2, Circle, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Alamat } from "@/lib/data/alamat";
import AlamatForm from "./AlamatForm";

type Props = {
  addresses: Alamat[];
  selectedAddressId: number | null;
  onSelectAddress: (id: number) => void;
  onAddressAdded: (alamatBaru: Alamat) => void;
};

export default function DaftarAlamat({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddressAdded,
}: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAdded = (alamatBaru: Alamat) => {
    onAddressAdded(alamatBaru);
    onSelectAddress(alamatBaru.id);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Alamat Pengiriman
          </h2>
          <p className="text-xs text-gray-500">
            Pilih alamat tersimpan atau tambahkan alamat baru untuk tujuan pengiriman.
          </p>
        </div>
        {!isFormOpen && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFormOpen(true)}
            className="h-8 gap-1.5 border-[#FF6B00] text-xs font-semibold text-[#FF6B00] hover:bg-orange-50 hover:text-[#e85f00]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Alamat
          </Button>
        )}
      </div>

      {/* Form Tambah Alamat Baru */}
      {isFormOpen && (
        <AlamatForm
          onSuccess={handleAdded}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {/* Daftar Alamat Tersimpan */}
      {addresses.length === 0 && !isFormOpen ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-[#FF6B00]">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            Belum ada alamat tersimpan
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Tambahkan alamat pengiriman terlebih dahulu untuk melanjutkan proses pesanan.
          </p>
          <Button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="mt-4 h-9 gap-1.5 bg-[#FF6B00] px-4 text-xs font-semibold text-white hover:bg-[#e85f00]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Alamat Baru
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {addresses.map((alamat) => {
            const isSelected = selectedAddressId === alamat.id;
            return (
              <button
                key={alamat.id}
                type="button"
                onClick={() => onSelectAddress(alamat.id)}
                className={`relative flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-[#FF6B00] bg-orange-50/30 shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="pt-0.5 text-[#FF6B00]">
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 fill-[#FF6B00] text-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">
                      {alamat.label}
                    </span>
                    {alamat.isDefault && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                        Utama
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-gray-800">
                    {alamat.name}{" "}
                    <span className="font-normal text-gray-500">
                      ({alamat.phone})
                    </span>
                  </p>

                  <p className="text-xs leading-relaxed text-gray-600">
                    {alamat.street}, {alamat.district}, {alamat.city},{" "}
                    {alamat.province} {alamat.postalCode}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
