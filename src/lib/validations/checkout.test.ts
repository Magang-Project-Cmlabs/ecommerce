import { describe, it, expect } from 'vitest';
import { checkoutSchema, itemKeranjangSchema } from './checkout';

describe('itemKeranjangSchema', () => {
  it('menerima item keranjang yang valid', () => {
    const valid = {
      productId: 1,
      variantId: 2,
      quantity: 3,
    };
    const res = itemKeranjangSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('menerima item tanpa varian (variantId: null)', () => {
    const valid = {
      productId: 1,
      variantId: null,
      quantity: 1,
    };
    const res = itemKeranjangSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('menolak kuantitas kurang dari 1 atau lebih dari 99', () => {
    expect(itemKeranjangSchema.safeParse({ productId: 1, variantId: null, quantity: 0 }).success).toBe(false);
    expect(itemKeranjangSchema.safeParse({ productId: 1, variantId: null, quantity: -1 }).success).toBe(false);
    expect(itemKeranjangSchema.safeParse({ productId: 1, variantId: null, quantity: 100 }).success).toBe(false);
  });
});

describe('checkoutSchema (PRD §6.1, KONTRAK_CHECKOUT §5)', () => {
  const dataValid = {
    addressId: 1,
    shippingMethod: 'jne_reg' as const,
    paymentMethod: 'qris' as const,
    promoCode: 'HEMAT10',
    notes: 'Tolong packing rapi',
    items: [
      { productId: 1, variantId: 10, quantity: 2 },
      { productId: 2, variantId: null, quantity: 1 },
    ],
  };

  it('menerima payload checkout yang valid', () => {
    const res = checkoutSchema.safeParse(dataValid);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.promoCode).toBe('HEMAT10');
      expect(res.data.notes).toBe('Tolong packing rapi');
    }
  });

  it('mengubah promoCode kosong atau spasi menjadi null', () => {
    const res = checkoutSchema.safeParse({ ...dataValid, promoCode: '   ' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.promoCode).toBe(null);
    }
  });

  it('mengubah promoCode menjadi uppercase', () => {
    const res = checkoutSchema.safeParse({ ...dataValid, promoCode: 'hemat10' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.promoCode).toBe('HEMAT10');
    }
  });

  it('menolak kurir yang tidak didukung', () => {
    const res = checkoutSchema.safeParse({ ...dataValid, shippingMethod: 'tiki_reg' });
    expect(res.success).toBe(false);
  });

  it('menolak metode pembayaran yang tidak didukung', () => {
    const res = checkoutSchema.safeParse({ ...dataValid, paymentMethod: 'kartu_kredit' });
    expect(res.success).toBe(false);
  });

  it('menolak keranjang belanja kosong', () => {
    const res = checkoutSchema.safeParse({ ...dataValid, items: [] });
    expect(res.success).toBe(false);
  });

  it('menolak barang duplikat di keranjang belanja', () => {
    const duplikat = checkoutSchema.safeParse({
      ...dataValid,
      items: [
        { productId: 1, variantId: 10, quantity: 1 },
        { productId: 1, variantId: 10, quantity: 2 },
      ],
    });
    expect(duplikat.success).toBe(false);
  });

  it('menerima produk sama dengan varian berbeda di keranjang belanja', () => {
    const varianBeda = checkoutSchema.safeParse({
      ...dataValid,
      items: [
        { productId: 1, variantId: 10, quantity: 1 },
        { productId: 1, variantId: 11, quantity: 2 },
      ],
    });
    expect(varianBeda.success).toBe(true);
  });

  it('menolak catatan yang melebihi 500 karakter', () => {
    const catatanPanjang = 'A'.repeat(501);
    const res = checkoutSchema.safeParse({ ...dataValid, notes: catatanPanjang });
    expect(res.success).toBe(false);
  });

  it('menolak pesanan dengan lebih dari 50 item', () => {
    const banyakItem = Array.from({ length: 51 }, (_, i) => ({
      productId: i + 1,
      variantId: null,
      quantity: 1,
    }));
    const res = checkoutSchema.safeParse({ ...dataValid, items: banyakItem });
    expect(res.success).toBe(false);
  });
});
