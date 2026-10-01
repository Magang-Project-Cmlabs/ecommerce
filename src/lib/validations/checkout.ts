// Skema validasi pembuatan pesanan checkout (PRD §6.1, KONTRAK_CHECKOUT.md §5).
// Dipakai bersama oleh form (client) dan Server Action buatPesanan (server).

import { z } from 'zod';

export const itemKeranjangSchema = z.object({
  productId: z.number({ error: 'ID produk tidak sah' }).int().positive({ error: 'ID produk tidak sah' }),
  variantId: z.number().int().positive().nullable(),
  quantity: z
    .number({ error: 'Jumlah produk tidak sah' })
    .int({ error: 'Jumlah produk harus bilangan bulat' })
    .min(1, { error: 'Jumlah minimal 1' })
    .max(99, { error: 'Jumlah maksimal 99 per item' }),
});

export const checkoutSchema = z.object({
  addressId: z.number({ error: 'Pilih alamat pengiriman terlebih dahulu' }).int().positive({ error: 'Pilih alamat pengiriman terlebih dahulu' }),
  shippingMethod: z.enum(['jne_reg', 'sicepat_reg', 'gosend_instant'], {
    error: 'Pilih kurir pengiriman yang valid',
  }),
  paymentMethod: z.enum(['qris', 'bank_bca', 'bank_mandiri', 'cod'], {
    error: 'Pilih metode pembayaran yang valid',
  }),
  promoCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(30, { error: 'Kode promo maksimal 30 karakter' })
    .optional()
    .transform((s) => (s && s.length > 0 ? s : null)),
  notes: z
    .string()
    .trim()
    .max(500, { error: 'Catatan untuk penjual maksimal 500 karakter' })
    .optional()
    .transform((s) => (s && s.length > 0 ? s : null)),
  items: z
    .array(itemKeranjangSchema)
    .min(1, { error: 'Keranjang belanja masih kosong' })
    .max(50, { error: 'Maksimal 50 item per pesanan' })
    .refine(
      (items) => new Set(items.map((i) => `${i.productId}:${i.variantId}`)).size === items.length,
      { error: 'Terdapat produk duplikat di dalam keranjang belanja' }
    ),
});

export type ItemKeranjangInput = z.input<typeof itemKeranjangSchema>;
export type ItemKeranjangOutput = z.output<typeof itemKeranjangSchema>;
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutOutput = z.output<typeof checkoutSchema>;

export const pratinjauCheckoutSchema = z.object({
  items: z.array(itemKeranjangSchema).max(50).refine(
    (items) => new Set(items.map((i) => `${i.productId}:${i.variantId}`)).size === items.length,
    { error: 'Terdapat produk duplikat di dalam keranjang belanja' },
  ),
  addressId: z.number().int().positive().optional(),
  shippingMethod: z.enum(['jne_reg', 'sicepat_reg', 'gosend_instant']).optional(),
  promoCode: z.string().trim().toUpperCase().max(30).optional(),
});

export const cekPromoSchema = z.object({
  code: z.string().trim().toUpperCase().min(1).max(30),
  subtotal: z.number().int().positive().max(2147483647),
});
