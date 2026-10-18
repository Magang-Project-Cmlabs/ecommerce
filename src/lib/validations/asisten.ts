import { z } from 'zod';
import { POLA_SLUG } from '@/lib/asisten/aksi';

// Riwayat percakapan yang dikirim dari panel asisten. Hanya teks; dibatasi agar murah dan aman.
// Riwayat datang dari browser sehingga tidak dipercaya: total panjangnya dibatasi supaya tidak
// bisa dijadikan prompt raksasa (mis. riwayat "asisten" palsu berisi instruksi).
export const BATAS_PESAN_ASISTEN = 600;
export const BATAS_RIWAYAT_ASISTEN = 6000;
export const pesanAsistenSchema = z.object({
  riwayat: z.array(z.object({
    peran: z.enum(['pengguna', 'asisten']),
    isi: z.string().trim().min(1).max(2000),
  })).min(1).max(12)
    .refine((r) => r.at(-1)?.peran === 'pengguna', { error: 'Pesan terakhir harus dari pengguna.' })
    .refine((r) => (r.at(-1)?.isi.length ?? 0) <= BATAS_PESAN_ASISTEN, { error: `Pertanyaan maksimal ${BATAS_PESAN_ASISTEN} karakter.` })
    .refine((r) => r.reduce((n, m) => n + m.isi.length, 0) <= BATAS_RIWAYAT_ASISTEN, { error: 'Percakapan terlalu panjang. Mulai percakapan baru.' }),
  // Konteks belanja dari browser (D23): halaman yang dibuka dan isi keranjang (hanya slug, varian, jumlah).
  // Nama dan harga selalu dibaca ulang dari database; konteks ini tidak dipercaya untuk hal lain.
  konteks: z.object({
    halaman: z.string().max(200).regex(/^\/[a-z0-9\-/]*$/).optional(),
    keranjang: z.array(z.object({
      slug: z.string().max(220).regex(POLA_SLUG),
      varianId: z.number().int().positive().nullable(),
      jumlah: z.number().int().min(1).max(99),
    })).max(50).default([]),
  }).optional(),
});
export type PesanAsistenInput = z.infer<typeof pesanAsistenSchema>;
