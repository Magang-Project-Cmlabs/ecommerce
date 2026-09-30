import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { checkoutSchema, pratinjauCheckoutSchema } from './checkout';


const itemSah = { productId: 12, variantId: null, quantity: 1 };

const checkoutSah = {
  addressId: 4,
  shippingMethod: 'jne_reg',
  paymentMethod: 'qris',
  items: [itemSah],
};

describe('checkoutSchema', () => {
  it('menerima checkout sah dan menormalkan promo serta catatan', () => {
    expect(
      checkoutSchema.parse({
        ...checkoutSah,
        promoCode: ' hemat10 ',
        notes: '  Tolong bungkus rapi  ',
      }),
    ).toEqual({
      ...checkoutSah,
      promoCode: 'HEMAT10',
      notes: 'Tolong bungkus rapi',
    });
  });

  it('mengubah promo dan catatan kosong atau tidak dikirim menjadi null', () => {
    expect(checkoutSchema.parse(checkoutSah)).toMatchObject({ promoCode: null, notes: null });
    expect(checkoutSchema.parse({ ...checkoutSah, promoCode: '  ', notes: '  ' })).toMatchObject({
      promoCode: null,
      notes: null,
    });
  });

  it.each([
    ['metode pengiriman', { shippingMethod: 'kurir_lain' }, 'shippingMethod'],
    ['metode pembayaran', { paymentMethod: 'ewallet' }, 'paymentMethod'],
    ['alamat bukan bilangan bulat positif', { addressId: 0 }, 'addressId'],
    ['kode promo lebih dari 30 karakter', { promoCode: 'A'.repeat(31) }, 'promoCode'],
    ['catatan lebih dari 500 karakter', { notes: 'a'.repeat(501) }, 'notes'],
    ['jumlah barang di bawah batas', { items: [{ ...itemSah, quantity: 0 }] }, 'items'],
    ['jumlah barang di atas batas', { items: [{ ...itemSah, quantity: 100 }] }, 'items'],
    ['jumlah pecahan', { items: [{ ...itemSah, quantity: 1.5 }] }, 'items'],
    ['ID produk bukan positif', { items: [{ ...itemSah, productId: -1 }] }, 'items'],
    ['ID varian bukan positif', { items: [{ ...itemSah, variantId: 0 }] }, 'items'],
  ])('mengembalikan error untuk %s pada field yang sesuai', (_, ubah, field) => {
    const result = checkoutSchema.safeParse({ ...checkoutSah, ...ubah });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(z.flattenError(result.error).fieldErrors).toHaveProperty(field);
  });

  it('menolak keranjang kosong dengan error di field items', () => {
    const result = checkoutSchema.safeParse({ ...checkoutSah, items: [] });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(z.flattenError(result.error).fieldErrors.items).toContain('Keranjang kosong');
  });

  it('menolak lebih dari 50 baris item dengan error di field items', () => {
    const items = Array.from({ length: 51 }, (_, index) => ({
      productId: index + 1,
      variantId: null,
      quantity: 1,
    }));
    const result = checkoutSchema.safeParse({ ...checkoutSah, items });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(z.flattenError(result.error).fieldErrors.items).toContain('Maksimal 50 jenis barang dalam satu pesanan');
  });

  it('menolak pasangan produk-varian duplikat pada field items', () => {
    const result = checkoutSchema.safeParse({ ...checkoutSah, items: [itemSah, itemSah] });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(z.flattenError(result.error).fieldErrors.items).toContain('Ada barang yang sama dua kali di keranjang');
  });

  it('menerima produk sama dengan varian berbeda dan ID null untuk produk tanpa varian', () => {
    const result = checkoutSchema.parse({
      ...checkoutSah,
      items: [
        { productId: 12, variantId: 1, quantity: 2 },
        { productId: 12, variantId: 2, quantity: 1 },
        { productId: 13, variantId: null, quantity: 1 },
      ],
    });
    expect(result.items).toHaveLength(3);
  });

  it('melaporkan beberapa error input sebagai error per field', () => {
    const result = checkoutSchema.safeParse({
      ...checkoutSah,
      addressId: -1,
      shippingMethod: 'kurir_lain',
      paymentMethod: 'ewallet',
      notes: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(z.flattenError(result.error).fieldErrors).sort()).toEqual([
      'addressId',
      'notes',
      'paymentMethod',
      'shippingMethod',
    ]);
  });
});

describe('pratinjauCheckoutSchema', () => {
  it('menerima input pratinjau parsial dan menormalkan kode promo', () => {
    expect(
      pratinjauCheckoutSchema.parse({
        items: [itemSah],
        promoCode: ' hemat10 ',
      }),
    ).toEqual({ items: [itemSah], addressId: undefined, shippingMethod: undefined, promoCode: 'HEMAT10' });
  });

  it('memvalidasi kurir dan alamat bila disertakan', () => {
    const result = pratinjauCheckoutSchema.safeParse({
      items: [itemSah],
      addressId: 0,
      shippingMethod: 'kurir_lain',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(z.flattenError(result.error).fieldErrors).sort()).toEqual(['addressId', 'shippingMethod']);
  });
});