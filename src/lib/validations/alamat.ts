// Skema validasi alamat pengiriman (KONTRAK_CHECKOUT.md §3).
// Dipakai bersama oleh form (client) dan Server Action (server).

import { z } from 'zod';
import { provinsiBaku } from '@/lib/pesanan/wilayah';

export const alamatSchema = z.object({
  label: z
    .string({ error: 'Label alamat wajib diisi' })
    .trim()
    .min(1, { error: 'Label alamat wajib diisi' })
    .max(50, { error: 'Label alamat maksimal 50 karakter' }),

  name: z
    .string({ error: 'Nama penerima wajib diisi' })
    .trim()
    .min(2, { error: 'Nama penerima minimal 2 karakter' })
    .max(100, { error: 'Nama penerima maksimal 100 karakter' }),

  phone: z
    .string({ error: 'Nomor telepon wajib diisi' })
    .transform((s) => s.replace(/[\s-]/g, ''))
    .refine((s) => /^(\+62|62|0)8\d{7,12}$/.test(s), {
      error: 'Nomor telepon tidak sah, contoh 081234567890',
    })
    .refine((s) => s.length <= 20, {
      error: 'Nomor telepon maksimal 20 digit',
    }),

  street: z
    .string({ error: 'Alamat lengkap wajib diisi' })
    .trim()
    .min(5, { error: 'Alamat lengkap minimal 5 karakter' })
    .max(255, { error: 'Alamat lengkap maksimal 255 karakter' }),

  district: z
    .string({ error: 'Kecamatan wajib diisi' })
    .trim()
    .min(1, { error: 'Kecamatan wajib diisi' })
    .max(100, { error: 'Kecamatan maksimal 100 karakter' }),

  city: z
    .string({ error: 'Kota/Kabupaten wajib diisi' })
    .trim()
    .min(1, { error: 'Kota/Kabupaten wajib diisi' })
    .max(100, { error: 'Kota/Kabupaten maksimal 100 karakter' }),

  province: z
    .string({ error: 'Provinsi wajib diisi' })
    .trim()
    .min(1, { error: 'Provinsi wajib diisi' })
    .max(100, { error: 'Provinsi maksimal 100 karakter' })
    // D19: simpan nama baku agar ongkir per zona selalu dikenali.
    .transform((p) => provinsiBaku(p) ?? p)
    .refine((p) => provinsiBaku(p) !== null, { error: 'Pilih provinsi dari daftar' }),

  postalCode: z
    .string({ error: 'Kode pos wajib diisi' })
    .trim()
    .regex(/^\d{5}$/, { error: 'Kode pos harus 5 digit angka' }),

  isDefault: z.boolean().optional().default(false),
});

export type AlamatInput = z.input<typeof alamatSchema>;
export type AlamatOutput = z.output<typeof alamatSchema>;
