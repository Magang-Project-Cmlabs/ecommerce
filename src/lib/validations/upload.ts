import { z } from 'zod';
export const tujuanUploadSchema = z.enum(['product', 'category', 'banner', 'review'], { error: 'Tujuan unggahan tidak valid.' });
export type TujuanUpload = z.infer<typeof tujuanUploadSchema>;
export const tokenUploadSchema = z.string().min(1, 'Token unggahan wajib diisi.').max(2048, 'Token unggahan tidak valid.');
export const unggahGambarSchema = z.object({
  purpose: tujuanUploadSchema,
  orderItemId: z.coerce.number().int('Item pesanan tidak valid.').positive('Item pesanan tidak valid.').optional(),
  files: z.array(z.file({ error: 'Pilih berkas gambar yang valid.' }).min(1, 'Berkas gambar kosong.').max(2 * 1024 * 1024, 'Gambar maksimal 2 MB.').mime(['image/jpeg', 'image/png', 'image/webp'], 'Gunakan gambar JPG, PNG, atau WebP.')).length(1, 'Pilih satu gambar untuk diunggah.'),
}).superRefine((data, ctx) => {
  if (data.purpose === 'review' && data.orderItemId === undefined) ctx.addIssue({ code: 'custom', path: ['orderItemId'], message: 'Pilih item pesanan untuk foto ulasan.' });
});
