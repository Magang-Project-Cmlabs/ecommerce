"use client";

// Komponen Tab 1: Ubah Profil Pengguna (PRD §5.1).
// Menampilkan dan mengelola data nama, email (read-only), no telepon, dan role.

import { useState, useTransition } from "react";
import { User, Mail, Phone, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ubahProfil } from "@/actions/akun";
import { ubahProfilSchema } from "@/lib/validations/akun";

type Props = {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: "customer" | "admin";
  };
};

export default function ProfilTab({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [isPending, startTransition] = useTransition();

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage(null);
    setErrorMessage(null);

    const validasi = ubahProfilSchema.safeParse({ name, phone });
    if (!validasi.success) {
      setErrors(validasi.error.flatten().fieldErrors);
      return;
    }

    startTransition(async () => {
      const res = await ubahProfil({
        name,
        phone: phone.trim() ? phone.trim() : null,
      });

      if (res.ok) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
        if (res.errors) setErrors(res.errors);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-foreground">Ubah Profil Pengguna</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Perbarui nama dan kontak Anda untuk kelancaran pengiriman barang dan komunikasi toko.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-3.5 text-xs text-green-800 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3.5 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Akun (Read-only Badge) */}
        <div className="flex items-center gap-2">
          <Label htmlFor="akun-role" className="text-xs font-semibold text-foreground/80">
            Peran Akun:
          </Label>
          <span
            id="akun-role"
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-foreground"
          >
            <Shield className="h-3 w-3" />
            {user.role === "admin" ? "Administrator" : "Pelanggan Terdaftar"}
          </span>
        </div>

        {/* Nama Lengkap */}
        <div>
          <Label htmlFor="profil-name" className="text-xs font-semibold text-foreground/80">
            Nama Lengkap *
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <Input
              id="profil-name"
              type="text"
              value={name}
              disabled={isPending}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap Anda"
              className="pl-9 text-xs"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-[11px] text-red-600">{errors.name[0]}</p>
          )}
        </div>

        {/* Alamat Email (Read-only) */}
        <div>
          <Label htmlFor="profil-email" className="text-xs font-semibold text-foreground/80">
            Alamat Email
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <Input
              id="profil-email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted pl-9 text-xs text-muted-foreground cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Alamat email terdaftar dan terikat secara permanen dengan akun Anda.
          </p>
        </div>

        {/* Nomor Telepon */}
        <div>
          <Label htmlFor="profil-phone" className="text-xs font-semibold text-foreground/80">
            Nomor Telepon (WhatsApp)
          </Label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <Input
              id="profil-phone"
              type="tel"
              value={phone}
              disabled={isPending}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="pl-9 text-xs"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-[11px] text-red-600">{errors.phone[0]}</p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Format Indonesia (diawali 08, 62, atau +62). Digunakan kurir untuk konfirmasi pengiriman paket.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan Perubahan...
              </>
            ) : (
              "Simpan Perubahan Profil"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
