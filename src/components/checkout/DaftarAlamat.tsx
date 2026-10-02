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
          <h2 className="text-base font-bold text-foreground">
            Alamat Pengiriman
          </h2>
          <p className="text-xs text-muted-foreground">
            Pilih alamat tersimpan atau tambahkan alamat baru untuk tujuan pengiriman.
          </p>
        </div>
        {!isFormOpen && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFormOpen(true)}
            size="sm"
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
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            Belum ada alamat tersimpan
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tambahkan alamat pengiriman terlebih dahulu untuk melanjutkan proses pesanan.
          </p>
          <Button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="mt-4"
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
                    ? "border-foreground bg-muted shadow-xs"
                    : "border-border bg-background hover:border-border"
                }`}
              >
                <div className="pt-0.5 text-foreground">
                  {isSelected ? (
                    <CheckCircle2 className="h-5 w-5 fill-foreground text-background" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/70" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {alamat.label}
                    </span>
                    {alamat.isDefault && (
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Utama
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-foreground">
                    {alamat.name}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({alamat.phone})
                    </span>
                  </p>

                  <p className="text-xs leading-relaxed text-muted-foreground">
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
