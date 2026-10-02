"use client";

// Komponen Tab 3: Kelola Alamat Pengiriman (PRD §5.3).
// Mendukung tambah alamat baru, edit alamat, hapus alamat, dan set alamat utama.

import { useState, useTransition } from "react";
import {
  Plus,
  CheckCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Alamat } from "@/lib/data/alamat";
import { setAlamatUtama, hapusAlamat } from "@/actions/alamat";
import AlamatForm from "@/components/checkout/AlamatForm";

type Props = {
  initialAddresses: Alamat[];
};

export default function AlamatTab({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<Alamat[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSetDefault = (id: number) => {
    startTransition(async () => {
      const res = await setAlamatUtama(id);
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
        setFeedback({ type: "success", message: "Alamat utama berhasil diperbarui." });
      } else {
        setFeedback({ type: "error", message: res.message || "Gagal mengubah alamat utama." });
      }
    });
  };

  const handleHapus = (id: number) => {
    setDeletingId(id);
    startTransition(async () => {
      const res = await hapusAlamat(id);
      if (res.ok) {
        setAddresses((prev) => {
          const filtered = prev.filter((a) => a.id !== id);
          // Jika yang dihapus default dan masih ada alamat lain, buat yang pertama default
          const wasDefault = prev.find((a) => a.id === id)?.isDefault;
          if (wasDefault && filtered.length > 0) {
            filtered[0] = { ...filtered[0]!, isDefault: true };
          }
          return filtered;
        });
        setFeedback({ type: "success", message: "Alamat berhasil dihapus." });
      } else {
        setFeedback({ type: "error", message: res.message || "Gagal menghapus alamat." });
      }
      setDeletingId(null);
      setConfirmDeleteId(null);
    });
  };

  const handleAddressAdded = (baru: Alamat) => {
    setAddresses((prev) => {
      if (baru.isDefault) {
        return [baru, ...prev.map((a) => ({ ...a, isDefault: false }))];
      }
      return [baru, ...prev];
    });
    setShowAddForm(false);
    setFeedback({ type: "success", message: "Alamat baru berhasil ditambahkan." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Buku Alamat Pengiriman</h2>
          <p className="mt-1 text-xs text-gray-500">
            Kelola daftar alamat pengiriman untuk mempercepat proses transaksi belanja Anda.
          </p>
        </div>

        {!showAddForm && (
          <Button
            type="button"
            onClick={() => setShowAddForm(true)}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Tambah Alamat
          </Button>
        )}
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
            feedback.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Tambah Alamat Baru */}
      {showAddForm && (
        <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-xs">
          <AlamatForm
            onSuccess={handleAddressAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Daftar Alamat */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <Home className="mx-auto h-10 w-10 text-gray-400 stroke-1" />
          <h3 className="mt-3 text-sm font-bold text-gray-900">
            Belum Ada Alamat Tersimpan
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Tambahkan alamat rumah atau kantor Anda untuk mulai berbelanja.
          </p>
          <Button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4" />
            Tambah Alamat Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((alamat) => (
            <div
              key={alamat.id}
              className={`relative rounded-xl border p-5 transition-all ${
                alamat.isDefault
                  ? "border-orange-300 bg-orange-50/20 shadow-xs"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-900">
                      {alamat.name}
                    </span>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      {alamat.label}
                    </span>
                    {alamat.isDefault && (
                      <span className="rounded-md bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                        Alamat Utama
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-600 font-mono">
                    {alamat.phone}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {alamat.street}, {alamat.district}, {alamat.city},{" "}
                    {alamat.province} {alamat.postalCode}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 sm:mt-0">
                  {!alamat.isDefault && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleSetDefault(alamat.id)}
                      className="h-8 rounded-full text-[11px] font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Jadikan Utama
                    </Button>
                  )}

                  {confirmDeleteId === alamat.id ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isPending || deletingId === alamat.id}
                        onClick={() => handleHapus(alamat.id)}
                        className="h-8 rounded-full px-3 text-[11px] font-bold"
                      >
                        {deletingId === alamat.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Hapus"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-8 rounded-full px-2.5 text-[11px]"
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteId(alamat.id)}
                      className="h-8 w-8 rounded-full p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Hapus alamat"
                      aria-label={`Hapus alamat ${alamat.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
