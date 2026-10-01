import { z } from 'zod';

const integer = z.coerce.number().int('Masukkan bilangan bulat.').min(0, 'Nilai tidak boleh negatif.').max(2_000_000_000, 'Nilai terlalu besar.');
const positive = integer.refine((n) => n > 0, 'Nilai harus lebih dari 0.');
const optionalInt = z.preprocess((v) => v === '' || v == null ? null : v, integer.nullable());
const optionalId = z.preprocess((v) => v === '' || v == null ? null : v, positive.nullable());
export const idAdminSchema = positive;
export const slugAdminSchema = z.string().trim().min(1, 'Slug wajib diisi.').max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Gunakan huruf kecil, angka, dan tanda hubung.');
const teks = (max: number) => z.string().trim().min(1, 'Wajib diisi.').max(max, `Maksimal ${max} karakter.`);

export const varianAdminSchema = z.object({ id: optionalId, name: teks(50), price: optionalInt.refine((v) => v === null || v > 0, 'Harga harus lebih dari 0.'), weight: optionalInt.refine((v) => v === null || v > 0, 'Berat harus lebih dari 0.'), stock: integer });
export const produkAdminSchema = z.object({
  id: optionalId, version: z.preprocess((v) => v === '' || v == null ? null : v, z.iso.datetime().nullable()), name: teks(200), slug: slugAdminSchema, description: teks(20_000), brand: teks(100),
  categoryId: positive, price: positive, compareAtPrice: optionalInt, stock: integer, weight: positive,
  isActive: z.boolean(), isFeatured: z.boolean(), isPreorder: z.boolean(), variantLabel: z.string().trim().max(50),
  variants: z.array(varianAdminSchema).max(30), specs: z.record(z.string().max(100), z.string().max(500)),
  tags: z.array(z.string().trim().min(1).max(50)).max(30), images: z.array(z.string().max(255)).max(8),
}).superRefine((data, ctx) => {
  if (data.id && !data.version) ctx.addIssue({ code: 'custom', path: ['version'], message: 'Muat ulang produk sebelum mengubah data.' });
  if (new Set(data.images).size !== data.images.length) ctx.addIssue({ code: 'custom', path: ['images'], message: 'Gambar tidak boleh berulang.' });
  if (data.compareAtPrice !== null && data.compareAtPrice <= data.price) ctx.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'Harga sebelum diskon harus melebihi harga jual.' });
  if (data.variants.length && !data.variantLabel) ctx.addIssue({ code: 'custom', path: ['variantLabel'], message: 'Isi label varian, misalnya Ukuran atau Warna.' });
  if (new Set(data.variants.map((v) => v.name.toLowerCase())).size !== data.variants.length) ctx.addIssue({ code: 'custom', path: ['variants'], message: 'Nama varian tidak boleh sama.' });
  if (new Set(data.variants.filter((v) => v.id !== null).map((v) => v.id)).size !== data.variants.filter((v) => v.id !== null).length) ctx.addIssue({ code: 'custom', path: ['variants'], message: 'ID varian tidak boleh berulang.' });
});

export const kategoriAdminSchema = z.object({ id: optionalId, name: teks(100), slug: slugAdminSchema.max(120), parentId: optionalId, sortOrder: integer });
export const promoAdminSchema = z.object({
  code: teks(30).regex(/^[A-Z0-9_-]+$/, 'Kode memakai huruf besar, angka, tanda hubung atau garis bawah.'),
  description: teks(255), type: z.enum(['PERCENT', 'FIXED']), value: positive,
  minSubtotal: integer, maxDiscount: optionalInt, quota: optionalInt, perUserLimit: positive,
  startsAt: z.coerce.date(), expiresAt: z.coerce.date(), isActive: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENT' && data.value > 100) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Diskon persen maksimal 100%.' });
  if (data.expiresAt <= data.startsAt) ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Tanggal berakhir harus setelah tanggal mulai.' });
});
export const bannerAdminSchema = z.object({
  id: optionalId, title: teks(150), subtitle: z.string().trim().max(255), cta: z.string().trim().max(50),
  href: z.string().trim().max(255).refine((v) => !v || (v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') && !/[\r\n]/.test(v)), 'Tautan harus mengarah ke halaman toko, misalnya /produk.'),
  sortOrder: integer, isActive: z.boolean(),
});
export const statusAdminSchema = z.object({
  orderId: positive, status: z.enum(['confirmed', 'packed', 'shipped', 'cancelled']),
  alasan: z.string().trim().max(200), trackingNumber: z.string().trim().max(50),
}).superRefine((data, ctx) => {
  if (data.status === 'cancelled' && !data.alasan) ctx.addIssue({ code: 'custom', path: ['alasan'], message: 'Alasan pembatalan wajib diisi.' });
  if (data.status === 'shipped' && !data.trackingNumber) ctx.addIssue({ code: 'custom', path: ['trackingNumber'], message: 'Nomor resi wajib diisi.' });
});

export type AdminActionState = { success?: boolean; message?: string; errors?: Record<string, string[]>; id?: number };
