// Skema validasi akun pengguna (PRD §6.2).
// Meliputi: ubah profil, ganti password, dan hapus akun (anonimisasi PDP).

import { z } from 'zod';

const phoneRegex = /^(\+62|62|0)8\d{7,12}$/;

export const ubahProfilSchema = z.object({
  name: z
    .string({ error: 'Nama minimal 2 karakter' })
    .trim()
    .min(2, { error: 'Nama minimal 2 karakter' })
    .max(100, { error: 'Nama maksimal 100 karakter' }),
  phone: z
    .string()
    .trim()
    .max(20, { error: 'Nomor telepon maksimal 20 digit' })
    .nullable()
    .optional()
    .transform((s) => {
      if (!s) return null;
      const cleaned = s.replace(/[\s-]/g, '');
      return cleaned.length > 0 ? cleaned : null;
    })
    .refine((s) => !s || phoneRegex.test(s), {
      error: 'Format nomor telepon tidak valid (contoh: 081234567890)',
    }),
});

export const gantiPasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: 'Password saat ini wajib diisi' })
      .min(1, { error: 'Password saat ini wajib diisi' }),
    newPassword: z
      .string({ error: 'Password baru minimal 8 karakter' })
      .min(8, { error: 'Password baru minimal 8 karakter' })
      .refine((s) => /^(?=.*[a-zA-Z])(?=.*\d)/.test(s), {
        error: 'Password harus memuat kombinasi huruf dan angka',
      }),
    confirmPassword: z
      .string({ error: 'Konfirmasi password wajib diisi' })
      .min(1, { error: 'Konfirmasi password wajib diisi' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Konfirmasi password baru tidak cocok',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    error: 'Password baru tidak boleh sama dengan password saat ini',
    path: ['newPassword'],
  });

export const hapusAkunSchema = z.object({
  password: z
    .string({ error: 'Masukkan password Anda untuk konfirmasi penghapusan' })
    .min(1, { error: 'Masukkan password Anda untuk konfirmasi penghapusan' }),
  konfirmasi: z.literal(true, {
    error: 'Anda harus menyetujui konsekuensi penghapusan akun',
  }),
});

export type UbahProfilInput = z.infer<typeof ubahProfilSchema>;
export type GantiPasswordInput = z.infer<typeof gantiPasswordSchema>;
export type HapusAkunInput = z.infer<typeof hapusAkunSchema>;
