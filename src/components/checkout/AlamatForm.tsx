"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { simpanAlamat } from "@/actions/alamat";
import { alamatSchema, type AlamatInput } from "@/lib/validations/alamat";
import type { Alamat } from "@/lib/data/alamat";

type Props = {
  onSuccess: (alamatBaru: Alamat) => void;
  onCancel: () => void;
};

export default function AlamatForm({ onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("Rumah");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [province, setProvince] = useState("DKI Jakarta");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof AlamatInput, string[]>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const input: AlamatInput = {
      label,
      name,
      phone,
      street,
      district,
      city,
      province,
      postalCode,
      isDefault,
    };

    const validasi = alamatSchema.safeParse(input);
    if (!validasi.success) {
      setErrors(validasi.error.flatten().fieldErrors);
      return;
    }

    startTransition(async () => {
      const res = await simpanAlamat(input);
      if (res.ok) {
        const dibuat: Alamat = {
          id: res.addressId,
          userId: 0,
          label: validasi.data.label,
          name: validasi.data.name,
          phone: validasi.data.phone,
          street: validasi.data.street,
          district: validasi.data.district,
          city: validasi.data.city,
          province: validasi.data.province,
          postalCode: validasi.data.postalCode,
          isDefault: validasi.data.isDefault ?? false,
        };
        onSuccess(dibuat);
      } else {
        if (res.errors) setErrors(res.errors);
        setGeneralError(res.message || "Gagal menyimpan alamat.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 shadow-xs"
    >
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-sm font-bold text-gray-900">Tambah Alamat Baru</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Tutup form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {generalError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {generalError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Label Alamat */}
        <div>
          <Label htmlFor="label" className="text-xs font-semibold text-gray-700">
            Label Alamat *
          </Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Contoh: Rumah, Kantor, Kos"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.label && (
            <p className="mt-1 text-[11px] text-red-600">{errors.label[0]}</p>
          )}
        </div>

        {/* Nama Penerima */}
        <div>
          <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
            Nama Penerima *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap penerima"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.name && (
            <p className="mt-1 text-[11px] text-red-600">{errors.name[0]}</p>
          )}
        </div>

        {/* Nomor Telepon */}
        <div className="sm:col-span-2">
          <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">
            Nomor Telepon *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="081234567890"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.phone && (
            <p className="mt-1 text-[11px] text-red-600">{errors.phone[0]}</p>
          )}
        </div>

        {/* Alamat Lengkap */}
        <div className="sm:col-span-2">
          <Label htmlFor="street" className="text-xs font-semibold text-gray-700">
            Alamat Lengkap (Jalan, No Rumah, RT/RW) *
          </Label>
          <Input
            id="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Nama jalan, gedung, nomor rumah, RT/RW"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.street && (
            <p className="mt-1 text-[11px] text-red-600">{errors.street[0]}</p>
          )}
        </div>

        {/* Kecamatan */}
        <div>
          <Label htmlFor="district" className="text-xs font-semibold text-gray-700">
            Kecamatan *
          </Label>
          <Input
            id="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Kecamatan"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.district && (
            <p className="mt-1 text-[11px] text-red-600">{errors.district[0]}</p>
          )}
        </div>

        {/* Kota / Kabupaten */}
        <div>
          <Label htmlFor="city" className="text-xs font-semibold text-gray-700">
            Kota / Kabupaten *
          </Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Contoh: Jakarta, Bandung, Surabaya"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.city && (
            <p className="mt-1 text-[11px] text-red-600">{errors.city[0]}</p>
          )}
        </div>

        {/* Provinsi */}
        <div>
          <Label htmlFor="province" className="text-xs font-semibold text-gray-700">
            Provinsi *
          </Label>
          <Input
            id="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="Provinsi"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.province && (
            <p className="mt-1 text-[11px] text-red-600">{errors.province[0]}</p>
          )}
        </div>

        {/* Kode Pos */}
        <div>
          <Label htmlFor="postalCode" className="text-xs font-semibold text-gray-700">
            Kode Pos * (5 digit)
          </Label>
          <Input
            id="postalCode"
            maxLength={5}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="12820"
            className="mt-1 h-9 bg-white text-xs"
            disabled={isPending}
          />
          {errors.postalCode && (
            <p className="mt-1 text-[11px] text-red-600">{errors.postalCode[0]}</p>
          )}
        </div>

        {/* Checkbox Default */}
        <div className="flex items-center gap-2 sm:col-span-2 pt-1">
          <Checkbox
            id="isDefault"
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked === true)}
            disabled={isPending}
          />
          <Label
            htmlFor="isDefault"
            className="cursor-pointer text-xs text-gray-600"
          >
            Jadikan sebagai alamat utama
          </Label>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="h-9 px-4 text-xs font-medium"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Simpan Alamat
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
