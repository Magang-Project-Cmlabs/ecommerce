import { z } from 'zod';


export const metodePengirimanSchema = z.enum(['jne_reg', 'sicepat_reg', 'gosend_instant'], {
  error: 'Pilih metode pengiriman yang sah',
});

export const metodePembayaranSchema = z.enum(['qris', 'bank_bca', 'bank_mandiri', 'cod'], {
  error: 'Pilih metode pembayaran yang sah',
});

const kodePromoSchema = z
  .string({ error: 'Kode promo harus berupa teks' })
  .trim()
  .toUpperCase()
  .max(30, { error: 'Kode promo maksimal 30 karakter' })
  .optional()
  .transform((kode) => kode || null);

export const itemKeranjangSchema = z.object({
  productId: z
    .number({ error: 'Pilih produk yang sah' })
    .int({ error: 'ID produk harus bilangan bulat' })
    .positive({ error: 'ID produk harus lebih dari 0' }),
  variantId: z
    .number({ error: 'Pilih varian yang sah' })
    .int({ error: 'ID varian harus bilangan bulat' })
    .positive({ error: 'ID varian harus lebih dari 0' })
    .nullable(),
  quantity: z
    .number({ error: 'Jumlah harus berupa angka' })
    .int({ error: 'Jumlah harus bilangan bulat' })
    .min(1, { error: 'Jumlah minimal 1' })
    .max(99, { error: 'Jumlah maksimal 99' }),
});

const itemsKeranjangSchema = z
  .array(itemKeranjangSchema)
  .min(1, { error: 'Keranjang kosong' })
  .max(50, { error: 'Maksimal 50 jenis barang dalam satu pesanan' })
  .refine(
    (items) => new Set(items.map(({ productId, variantId }) => `${productId}:${variantId}`)).size === items.length,
    { error: 'Ada barang yang sama dua kali di keranjang' },
  );

const addressIdSchema = z
  .number({ error: 'Pilih alamat pengiriman yang sah' })
  .int({ error: 'ID alamat harus bilangan bulat' })
  .positive({ error: 'Pilih alamat pengiriman yang sah' });

export const pratinjauCheckoutSchema = z.object({
  items: itemsKeranjangSchema,
  addressId: addressIdSchema.optional(),
  shippingMethod: metodePengirimanSchema.optional(),
  promoCode: kodePromoSchema,
});

export const checkoutSchema = z.object({
  addressId: addressIdSchema,
  shippingMethod: metodePengirimanSchema,
  paymentMethod: metodePembayaranSchema,
  promoCode: kodePromoSchema,
  notes: z
    .string({ error: 'Catatan harus berupa teks' })
    .trim()
    .max(500, { error: 'Catatan maksimal 500 karakter' })
    .optional()
    .transform((catatan) => catatan || null),
  items: itemsKeranjangSchema,
});

export type ItemKeranjangInput = z.output<typeof itemKeranjangSchema>;
export type PratinjauInput = z.output<typeof pratinjauCheckoutSchema>;
export type CheckoutInput = z.output<typeof checkoutSchema>;

export type ItemPratinjau = {
  productId: number;
  variantId: number | null;
  name: string;
  variantName: string | null;
  image: string | null;
  price: number;
  weight: number;
  quantity: number;
  stock: number;
  isPreorder: boolean;
  masalah: null | 'tidak_aktif' | 'varian_wajib' | 'stok_kurang' | 'stok_habis';
};

export type Pratinjau = {
  items: ItemPratinjau[];
  subtotal: number;
  totalWeight: number;
  shippingOptions: {
    method: z.output<typeof metodePengirimanSchema>;
    label: string;
    estimate: string;
    cost: number;
    available: boolean;
    reason: string | null;
  }[];
  shippingCost: number | null;
  promo: null | { ok: true; code: string; description: string; discount: number } | { ok: false; code: string; message: string };
  discount: number;
  grandTotal: number;
};

export type HasilBuatPesanan =
  | { ok: true; orderNumber: string }
  | {
      ok: false;
      errors?: Partial<
        Record<'addressId' | 'shippingMethod' | 'paymentMethod' | 'promoCode' | 'notes' | 'items', string[]>
      >;
      message?: string;
      items?: Pratinjau['items'];
    };