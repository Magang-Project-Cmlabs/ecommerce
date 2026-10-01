import { z } from 'zod';
export const nomorPesananSchema = z.string().regex(/^INV-\d{6}-\d{4,9}$/, 'Nomor pesanan tidak valid');
export const batalPesananSchema = z.object({ orderNumber: nomorPesananSchema, alasan: z.string().trim().min(1, 'Alasan pembatalan wajib diisi').max(200, 'Alasan maksimal 200 karakter') });
