// Skema isian akun, dipakai bersama oleh form (client) dan Server Action (server).
// PRD §7.7 (daftar/masuk), §13 (password min. 8 karakter), §15 (persetujuan).

import { z } from 'zod';

const BATAS_BCRYPT_BYTE = 72; // bcrypt diam-diam memotong sisa di atas 72 byte

const email = z
  .string({ error: 'Email wajib diisi' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Format email tidak sah' }).max(191, { error: 'Email terlalu panjang' }));

export const daftarSchema = z
  .object({
    name: z
      .string({ error: 'Nama wajib diisi' })
      .trim()
      .min(2, { error: 'Nama minimal 2 karakter' })
      .max(100, { error: 'Nama maksimal 100 karakter' }),
    email,
    phone: z
      .string()
      .optional()
      .transform((s) => s?.replace(/[\s-]/g, '') ?? '')
      .refine((s) => s === '' || /^(\+62|62|0)8\d{7,12}$/.test(s), {
        error: 'Nomor telepon tidak sah, contoh 081234567890',
      })
      .transform((s) => s || null),
    password: z
      .string({ error: 'Password wajib diisi' })
      .min(8, { error: 'Password minimal 8 karakter' })
      .refine((s) => new TextEncoder().encode(s).length <= BATAS_BCRYPT_BYTE, {
        error: 'Password terlalu panjang (maksimal 72 byte)',
      }),
    confirmPassword: z.string({ error: 'Ulangi password' }),
    agree: z.literal('on', { error: 'Setujui Syarat & Ketentuan dan Kebijakan Privasi untuk mendaftar' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
    // Zod 4 melewati cek objek bila ada kolom lain yang salah. Tetap jalankan
    // selama kedua password berupa teks, agar semua galat tampil sekaligus.
    when: ({ value }) => {
      const v = value as { password?: unknown; confirmPassword?: unknown };
      return typeof v.password === 'string' && typeof v.confirmPassword === 'string';
    },
  })
  .transform(({ name, email, phone, password }) => ({ name, email, phone, password }));

export const masukSchema = z.object({
  email,
  // Tanpa aturan panjang minimal: akun lama dengan aturan berbeda tetap bisa masuk.
  password: z
    .string({ error: 'Password wajib diisi' })
    .min(1, { error: 'Password wajib diisi' })
    .max(1000, { error: 'Password terlalu panjang' }),
});

export type DaftarInput = z.output<typeof daftarSchema>;
export type MasukInput = z.output<typeof masukSchema>;

/**
 * Tujuan setelah masuk/daftar dari parameter `?next=`. Hanya path internal yang
 * diterima (mencegah open redirect ke situs lain); halaman auth sendiri
 * ditolak agar tidak berputar-putar. Selain itu mengembalikan null.
 */
export function amanNext(nilai: string | null | undefined): string | null {
  if (typeof nilai !== 'string' || nilai.length === 0 || nilai.length > 2000) return null;
  if (!nilai.startsWith('/') || nilai.startsWith('//') || nilai.startsWith('/\\')) return null;
  if (/[\u0000-\u001f\\]/.test(nilai)) return null;
  const DASAR = 'http://tokokita.invalid';
  let url: URL;
  try {
    url = new URL(nilai, DASAR);
  } catch {
    return null;
  }
  if (url.origin !== DASAR) return null;
  if (/^\/(masuk|daftar)(\/|$)/.test(url.pathname)) return null;
  return url.pathname + url.search + url.hash;
}
