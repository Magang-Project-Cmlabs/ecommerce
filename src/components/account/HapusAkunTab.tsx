"use client";

// Komponen Tab 4: Hapus Akun via Anonimisasi UU PDP (PRD §5.4).
// Menegakkan kepatuhan regulasi pelindungan data pribadi tanpa merusak relasi akuntansi.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { hapusAkun } from "@/actions/akun";
import { hapusAkunSchema } from "@/lib/validations/akun";

export default function HapusAkunTab() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage(null);

    const validasi = hapusAkunSchema.safeParse({ password, konfirmasi });
    if (!validasi.success) {
      setErrors(validasi.error.flatten().fieldErrors);
      return;
    }

    startTransition(async () => {
      const res = await hapusAkun({ password, konfirmasi: true });

      if (res.ok) {
        alert("Akun Anda telah berhasil dinonaktifkan. Seluruh data pribadi telah dihapus.");
        router.push("/");
        router.refresh();
      } else {
        setErrorMessage(res.message);
        if (res.errors) setErrors(res.errors);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-red-600 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          <span>Hapus Akun Pengguna</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Tindakan ini akan menonaktifkan akun Anda secara permanen dan menghapus seluruh data pribadi.
        </p>
      </div>

      {/* Peringatan Hukum & Kepatuhan UU PDP */}
      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-4 text-xs text-red-900 dark:text-red-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-800 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span>Pemberitahuan Pelindungan Data Pribadi (UU PDP):</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300 leading-relaxed pl-1">
          <li>Nama, nomor telepon, dan alamat tersimpan Anda akan dihapus secara permanen dari server TokoKita.</li>
          <li>Alamat email Anda akan diacak/dianonimkan sehingga tidak lagi dapat diidentifikasi.</li>
          <li>Sesi login Anda akan dicabut seketika dan Anda tidak dapat masuk kembali menggunakan akun ini.</li>
          <li>Riwayat pesanan masa lalu akan tetap dipertahankan secara anonim demi kepatuhan pembukuan finansial toko.</li>
        </ul>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-800 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Konfirmasi Password */}
        <div>
          <Label htmlFor="hapus-password" className="text-xs font-semibold text-foreground/80">
            Masukkan Password Anda untuk Konfirmasi *
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
            <Input
              id="hapus-password"
              type={showPassword ? "text" : "password"}
              value={password}
              disabled={isPending}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ketik password akun Anda saat ini"
              className="pl-9 pr-10 text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground/70 hover:text-muted-foreground"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-red-600">{errors.password[0]}</p>
          )}
        </div>

        {/* Checkbox Persetujuan */}
        <div className="flex items-start gap-2.5 pt-1">
          <Checkbox
            id="hapus-konfirmasi"
            checked={konfirmasi}
            onCheckedChange={(checked) => setKonfirmasi(checked === true)}
            disabled={isPending}
            className="mt-0.5"
          />
          <Label
            htmlFor="hapus-konfirmasi"
            className="cursor-pointer text-xs leading-relaxed text-foreground/80"
          >
            Saya mengerti dan menyetujui bahwa akun saya akan dinonaktifkan secara permanen serta seluruh data pribadi saya akan dihapus tanpa dapat dipulihkan kembali.
          </Label>
        </div>
        {errors.konfirmasi && (
          <p className="text-[11px] text-red-600">{errors.konfirmasi[0]}</p>
        )}

        <div className="pt-3">
          <Button
            type="submit"
            variant="destructive"
            disabled={isPending || !konfirmasi || !password}
            className="h-10 gap-2 rounded-full px-6 text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses Anonimisasi Akun...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Hapus Akun Saya Secara Permanen
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
