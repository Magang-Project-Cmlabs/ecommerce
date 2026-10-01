"use client";

// Komponen Tab 2: Ganti Password Pengguna (PRD §5.2).
// Menegakkan verifikasi bcrypt password lama dan aturan keamanan password baru.

import { useState, useTransition } from "react";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { gantiPassword } from "@/actions/akun";
import { gantiPasswordSchema } from "@/lib/validations/akun";

export default function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage(null);
    setErrorMessage(null);

    const validasi = gantiPasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validasi.success) {
      setErrors(validasi.error.flatten().fieldErrors);
      return;
    }

    startTransition(async () => {
      const res = await gantiPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.ok) {
        setSuccessMessage(res.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMessage(res.message);
        if (res.errors) setErrors(res.errors);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900">Ganti Password</h2>
        <p className="mt-1 text-xs text-gray-500">
          Gunakan password yang kuat dengan minimal 8 karakter yang memuat kombinasi huruf dan angka.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password Saat Ini */}
        <div>
          <Label htmlFor="current-password" className="text-xs font-semibold text-gray-700">
            Password Saat Ini *
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              disabled={isPending}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              className="pl-9 pr-10 text-xs"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label={showCurrent ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-[11px] text-red-600">{errors.currentPassword[0]}</p>
          )}
        </div>

        {/* Password Baru */}
        <div>
          <Label htmlFor="new-password" className="text-xs font-semibold text-gray-700">
            Password Baru *
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              disabled={isPending}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter kombinasi huruf & angka"
              className="pl-9 pr-10 text-xs"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-[11px] text-red-600">{errors.newPassword[0]}</p>
          )}
        </div>

        {/* Konfirmasi Password Baru */}
        <div>
          <Label htmlFor="confirm-password" className="text-xs font-semibold text-gray-700">
            Konfirmasi Password Baru *
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              disabled={isPending}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru Anda"
              className="pl-9 pr-10 text-xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[11px] text-red-600">{errors.confirmPassword[0]}</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 gap-2 rounded-full bg-[#FF6B00] px-6 text-xs font-bold text-white hover:bg-[#e85f00] disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memperbarui Password...
              </>
            ) : (
              "Simpan Password Baru"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
