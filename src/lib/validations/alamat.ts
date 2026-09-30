import { z } from 'zod';


const teleponAlamatSchema = z
  .string({ error: 'Nomor telepon wajib diisi' })
  .transform((telepon) => telepon.replace(/[\s-]/g, ''))
  .pipe(
    z
      .string()
      .min(1, { error: 'Nomor telepon wajib diisi' })
      .max(20, { error: 'Nomor telepon maksimal 20 karakter' })
      .regex(/^(\+62|62|0)8\d{7,12}$/, {
        error: 'Nomor telepon tidak sah, contoh 081234567890',
      }),
  );

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
  phone: teleponAlamatSchema,
  street: z
    .string({ error: 'Alamat jalan wajib diisi' })
    .trim()
    .min(5, { error: 'Alamat jalan minimal 5 karakter' })
    .max(255, { error: 'Alamat jalan maksimal 255 karakter' }),
  district: z
    .string({ error: 'Kecamatan wajib diisi' })
    .trim()
    .min(1, { error: 'Kecamatan wajib diisi' })
    .max(100, { error: 'Kecamatan maksimal 100 karakter' }),
  city: z
    .string({ error: 'Kota wajib diisi' })
    .trim()
    .min(1, { error: 'Kota wajib diisi' })
    .max(100, { error: 'Kota maksimal 100 karakter' }),
  province: z
    .string({ error: 'Provinsi wajib diisi' })
    .trim()
    .min(1, { error: 'Provinsi wajib diisi' })
    .max(100, { error: 'Provinsi maksimal 100 karakter' }),
  postalCode: z
    .string({ error: 'Kode pos wajib diisi' })
    .regex(/^\d{5}$/, { error: 'Kode pos harus terdiri dari 5 angka' }),
  isDefault: z.boolean({ error: 'Alamat utama harus berupa nilai boolean' }).default(false),
});

export type AlamatInput = z.output<typeof alamatSchema>;