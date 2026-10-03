import { z } from 'zod';

// Riwayat percakapan yang dikirim dari panel asisten. Hanya teks; dibatasi agar murah dan aman.
export const BATAS_PESAN_ASISTEN = 600;
export const pesanAsistenSchema = z.object({
  riwayat: z.array(z.object({
    peran: z.enum(['pengguna', 'asisten']),
    isi: z.string().trim().min(1).max(2000),
  })).min(1).max(12)
    .refine((r) => r.at(-1)?.peran === 'pengguna', { error: 'Pesan terakhir harus dari pengguna.' })
    .refine((r) => (r.at(-1)?.isi.length ?? 0) <= BATAS_PESAN_ASISTEN, { error: `Pertanyaan maksimal ${BATAS_PESAN_ASISTEN} karakter.` }),
});
export type PesanAsistenInput = z.infer<typeof pesanAsistenSchema>;
