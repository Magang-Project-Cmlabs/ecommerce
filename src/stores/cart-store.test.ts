import { describe, it, expect, beforeEach } from 'vitest';
import {
  useCartStore,
  MAX_KUANTITAS_PER_ITEM,
  selectTotalItem,
  selectSubtotal,
  selectItems,
} from './cart-store';

describe('cart-store (Zustand)', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], terbuka: false, appliedPromo: null });
  });

  it('memiliki kondisi awal keranjang kosong', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.totalItem()).toBe(0);
    expect(state.subtotal()).toBe(0);
    expect(selectTotalItem(state)).toBe(0);
    expect(selectSubtotal(state)).toBe(0);
    expect(selectItems(state)).toEqual([]);
  });

  it('menambahkan item baru dengan kuantitas default 1', () => {
    const { tambahItem } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: null,
      slug: 'batik-modern',
      name: 'Kemeja Batik Modern',
      variantName: null,
      image: '/products/batik.jpg',
      price: 125000,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual({
      productId: 1,
      variantId: null,
      quantity: 1,
      slug: 'batik-modern',
      name: 'Kemeja Batik Modern',
      variantName: null,
      image: '/products/batik.jpg',
      price: 125000,
    });
    expect(state.totalItem()).toBe(1);
    expect(state.subtotal()).toBe(125000);
  });

  it('menambahkan item baru dengan kuantitas tertentu', () => {
    const { tambahItem } = useCartStore.getState();

    tambahItem({
      productId: 2,
      variantId: null,
      quantity: 3,
      slug: 'sneakers',
      name: 'Sneakers',
      variantName: null,
      image: '/products/sneakers.jpg',
      price: 150000,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(3);
    expect(state.totalItem()).toBe(3);
    expect(state.subtotal()).toBe(450000);
  });

  it('menambah kuantitas jika item dengan productId dan variantId yang sama dimasukkan lagi', () => {
    const { tambahItem } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: 10,
      quantity: 2,
      slug: 'baju-batik',
      name: 'Baju Batik',
      variantName: 'Ukuran L',
      image: '/products/batik.jpg',
      price: 100000,
    });

    tambahItem({
      productId: 1,
      variantId: 10,
      quantity: 3,
      slug: 'baju-batik',
      name: 'Baju Batik',
      variantName: 'Ukuran L',
      image: '/products/batik.jpg',
      price: 100000,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.quantity).toBe(5);
    expect(state.totalItem()).toBe(5);
    expect(state.subtotal()).toBe(500000);
  });

  it('memisahkan item dengan productId sama tetapi variantId berbeda', () => {
    const { tambahItem } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: 10,
      quantity: 1,
      slug: 'baju-batik',
      name: 'Baju Batik',
      variantName: 'Ukuran M',
      image: '/products/batik.jpg',
      price: 100000,
    });

    tambahItem({
      productId: 1,
      variantId: 11,
      quantity: 2,
      slug: 'baju-batik',
      name: 'Baju Batik',
      variantName: 'Ukuran L',
      image: '/products/batik.jpg',
      price: 100000,
    });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.totalItem()).toBe(3);
    expect(state.subtotal()).toBe(300000);
  });

  it('membatasi kuantitas maksimal 99 per item sesuai D13', () => {
    const { tambahItem } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: null,
      quantity: 95,
      slug: 'item-1',
      name: 'Item 1',
      variantName: null,
      image: null,
      price: 10000,
    });

    tambahItem({
      productId: 1,
      variantId: null,
      quantity: 10,
      slug: 'item-1',
      name: 'Item 1',
      variantName: null,
      image: null,
      price: 10000,
    });

    const state = useCartStore.getState();
    expect(state.items[0]?.quantity).toBe(MAX_KUANTITAS_PER_ITEM);
    expect(state.totalItem()).toBe(99);
  });

  it('mengubah jumlah kuantitas dengan ubahJumlah', () => {
    const { tambahItem, ubahJumlah } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: null,
      quantity: 2,
      slug: 'item-1',
      name: 'Item 1',
      variantName: null,
      image: null,
      price: 20000,
    });

    ubahJumlah(1, null, 7);

    const state = useCartStore.getState();
    expect(state.items[0]?.quantity).toBe(7);
    expect(state.totalItem()).toBe(7);
    expect(state.subtotal()).toBe(140000);
  });

  it('menghapus item jika ubahJumlah diberikan nilai 0 atau negatif', () => {
    const { tambahItem, ubahJumlah } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: null,
      quantity: 2,
      slug: 'item-1',
      name: 'Item 1',
      variantName: null,
      image: null,
      price: 20000,
    });

    ubahJumlah(1, null, 0);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.totalItem()).toBe(0);
  });

  it('menghapus item tertentu dengan hapusItem', () => {
    const { tambahItem, hapusItem } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: null,
      quantity: 1,
      slug: 'item-1',
      name: 'Item 1',
      variantName: null,
      image: null,
      price: 20000,
    });
    tambahItem({
      productId: 2,
      variantId: null,
      quantity: 1,
      slug: 'item-2',
      name: 'Item 2',
      variantName: null,
      image: null,
      price: 30000,
    });

    hapusItem(1, null);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.productId).toBe(2);
    expect(state.totalItem()).toBe(1);
    expect(state.subtotal()).toBe(30000);
  });

  it('mengosongkan seluruh keranjang dengan kosongkanKeranjang', () => {
    const { tambahItem, kosongkanKeranjang } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: null,
      quantity: 3,
      slug: 'item-1',
      name: 'Item 1',
      variantName: null,
      image: null,
      price: 20000,
    });
    tambahItem({
      productId: 2,
      variantId: 5,
      quantity: 2,
      slug: 'item-2',
      name: 'Item 2',
      variantName: 'Varian A',
      image: null,
      price: 50000,
    });

    kosongkanKeranjang();

    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.totalItem()).toBe(0);
    expect(state.subtotal()).toBe(0);
  });

  it('melakukan partialize hanya menyimpan items ke storage', () => {
    const partialize = useCartStore.persist.getOptions().partialize;
    const mockState = {
      ...useCartStore.getState(),
      items: [
        {
          productId: 1,
          variantId: null,
          quantity: 2,
          slug: 'test',
          name: 'Test',
          variantName: null,
          image: null,
          price: 50000,
        },
      ],
    };

    const dataTersimpan = partialize ? partialize(mockState) : null;
    expect(dataTersimpan).toEqual({
      items: mockState.items,
    });
    // Memastikan fungsi-fungsi aksi tidak ikut disimpan
    expect((dataTersimpan as Record<string, unknown>)['tambahItem']).toBeUndefined();
    expect((dataTersimpan as Record<string, unknown>)['kosongkanKeranjang']).toBeUndefined();
  });

  it('mengelola status terbuka dan tertutupnya drawer keranjang', () => {
    const store = useCartStore.getState();
    expect(useCartStore.getState().terbuka).toBe(false);

    store.bukaKeranjang();
    expect(useCartStore.getState().terbuka).toBe(true);

    store.tutupKeranjang();
    expect(useCartStore.getState().terbuka).toBe(false);

    store.setTerbuka(true);
    expect(useCartStore.getState().terbuka).toBe(true);
  });

  it('mengelola kode promo dan menghitung totalAkhir secara dinamis', () => {
    const { tambahItem, ubahJumlah, setAppliedPromo, hapusPromo } = useCartStore.getState();

    tambahItem({
      productId: 1,
      variantId: null,
      quantity: 2,
      slug: 'baju',
      name: 'Baju',
      variantName: null,
      image: null,
      price: 100000,
    });

    const stateAwal = useCartStore.getState();
    expect(stateAwal.subtotal()).toBe(200000);
    expect(stateAwal.totalAkhir()).toBe(200000);

    // Terapkan promo HEMAT10 (10% max 50rb, minSubtotal 100rb)
    setAppliedPromo({
      code: 'HEMAT10',
      description: 'Hemat 10%',
      discount: 20000,
      type: 'PERCENT',
      value: 10,
      minSubtotal: 100000,
      maxDiscount: 50000,
    });

    expect(useCartStore.getState().totalAkhir()).toBe(180000);

    // Tambah item: subtotal naik jadi 300.000, diskon 10% jadi 30.000, totalAkhir jadi 270.000
    ubahJumlah(1, null, 3);
    expect(useCartStore.getState().subtotal()).toBe(300000);
    expect(useCartStore.getState().totalAkhir()).toBe(270000);

    // Kurangi item di bawah minSubtotal (misal jadi 50.000): diskon tidak berlaku (0)
    tambahItem({
      productId: 2,
      variantId: null,
      quantity: 1,
      slug: 'kaos',
      name: 'Kaos',
      variantName: null,
      image: null,
      price: 50000,
    });
    useCartStore.getState().hapusItem(1, null);
    expect(useCartStore.getState().subtotal()).toBe(50000);
    expect(useCartStore.getState().totalAkhir()).toBe(50000);

    hapusPromo();
    const stateSetelahHapus = useCartStore.getState();
    expect(stateSetelahHapus.appliedPromo).toBeNull();
    expect(stateSetelahHapus.totalAkhir()).toBe(50000);
  });
});
