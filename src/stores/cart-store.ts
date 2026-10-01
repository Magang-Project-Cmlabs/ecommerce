// Store keranjang belanja TokoKita di localStorage (Zustand).
// Sesuai kontrak KONTRAK_CHECKOUT.md §2 dan keputusan D13 di OPEN_DECISIONS.md.

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

export const MAX_KUANTITAS_PER_ITEM = 99;
export const NAMA_STORAGE_KERANJANG = 'tokokita-cart';

/**
 * Bentuk item keranjang sesuai kontrak KONTRAK_CHECKOUT.md §2.
 * Catatan: data di sini hanya untuk tampilan di client dan tidak pernah
 * dipercaya bulat-bulat oleh server saat checkout.
 */
export type ItemKeranjang = {
  productId: number;
  variantId: number | null; // wajib terisi untuk produk bervarian (PRD §10.1)
  quantity: number;         // bulat, 1–99 (D13)
  slug: string;
  name: string;
  variantName: string | null;
  image: string | null;
  price: number;            // harga saat dimasukkan (INT rupiah)
};

export type TambahItemInput = Omit<ItemKeranjang, 'quantity'> & {
  quantity?: number;
};

export type AppliedPromo = {
  code: string;
  description: string;
  discount: number;
  type?: 'PERCENT' | 'FIXED';
  value?: number;
  minSubtotal?: number;
  maxDiscount?: number | null;
};

export function hitungDiskonPromo(
  subtotal: number,
  promo: AppliedPromo | null
): number {
  if (!promo) return 0;
  if (promo.minSubtotal !== undefined && subtotal < promo.minSubtotal) {
    return 0;
  }
  if (promo.type === 'PERCENT' && promo.value !== undefined) {
    let d = Math.floor((subtotal * promo.value) / 100);
    if (promo.maxDiscount) d = Math.min(d, promo.maxDiscount);
    return Math.min(d, subtotal);
  }
  if (promo.type === 'FIXED' && promo.value !== undefined) {
    return Math.min(promo.value, subtotal);
  }
  return Math.min(promo.discount, subtotal);
}

export interface CartState {
  items: ItemKeranjang[];
  terbuka: boolean;
  appliedPromo: AppliedPromo | null;

  // Kontrol Drawer
  bukaKeranjang: () => void;
  tutupKeranjang: () => void;
  setTerbuka: (terbuka: boolean) => void;

  // Aksi Keranjang
  tambahItem: (item: TambahItemInput) => void;
  ubahJumlah: (productId: number, variantId: number | null, quantity: number) => void;
  hapusItem: (productId: number, variantId: number | null) => void;
  kosongkanKeranjang: () => void;

  // Aksi Promo
  setAppliedPromo: (promo: AppliedPromo | null) => void;
  hapusPromo: () => void;

  // Kalkulasi
  totalItem: () => number;
  subtotal: () => number;
  totalAkhir: () => number;
}

const storagePenyimpan = (): StateStorage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  // Penyimpanan in-memory fallback untuk SSR atau Node.js environment
  const memori = new Map<string, string>();
  return {
    getItem: (k: string) => memori.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memori.set(k, v);
    },
    removeItem: (k: string) => {
      memori.delete(k);
    },
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      terbuka: false,
      appliedPromo: null,

      bukaKeranjang: () => set({ terbuka: true }),
      tutupKeranjang: () => set({ terbuka: false }),
      setTerbuka: (terbuka) => set({ terbuka }),

      setAppliedPromo: (promo) => set({ appliedPromo: promo }),
      hapusPromo: () => set({ appliedPromo: null }),

      tambahItem: (input) => {
        const jumlahTambah = Math.min(
          Math.max(Math.floor(input.quantity ?? 1), 1),
          MAX_KUANTITAS_PER_ITEM
        );

        set((state) => {
          const index = state.items.findIndex(
            (i) => i.productId === input.productId && i.variantId === input.variantId
          );

          if (index > -1) {
            const existing = state.items[index]!;
            const kuantitasBaru = Math.min(
              existing.quantity + jumlahTambah,
              MAX_KUANTITAS_PER_ITEM
            );
            const salinan = [...state.items];
            salinan[index] = { ...existing, quantity: kuantitasBaru };
            return { items: salinan, terbuka: true };
          }

          const itemBaru: ItemKeranjang = {
            productId: input.productId,
            variantId: input.variantId,
            quantity: jumlahTambah,
            slug: input.slug,
            name: input.name,
            variantName: input.variantName,
            image: input.image,
            price: input.price,
          };

          return { items: [...state.items, itemBaru], terbuka: true };
        });
      },

      ubahJumlah: (productId, variantId, quantity) => {
        const jumlahBulat = Math.floor(quantity);
        if (jumlahBulat <= 0) {
          get().hapusItem(productId, variantId);
          return;
        }

        const validQty = Math.min(
          Math.max(jumlahBulat, 1),
          MAX_KUANTITAS_PER_ITEM
        );

        set((state) => {
          const newItems = state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: validQty }
              : i
          );
          return { items: newItems };
        });
      },

      hapusItem: (productId, variantId) => {
        set((state) => {
          const newItems = state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          );
          // Jika keranjang menjadi kosong, hapus juga promo yang menempel
          const appliedPromo = newItems.length === 0 ? null : state.appliedPromo;
          return { items: newItems, appliedPromo };
        });
      },

      kosongkanKeranjang: () => {
        set({ items: [], appliedPromo: null });
      },

      totalItem: () => {
        return get().items.reduce((total, i) => total + i.quantity, 0);
      },

      subtotal: () => {
        return get().items.reduce((total, i) => total + i.price * i.quantity, 0);
      },

      totalAkhir: () => {
        const sub = get().subtotal();
        const diskon = hitungDiskonPromo(sub, get().appliedPromo);
        return Math.max(0, sub - diskon);
      },
    }),
    {
      name: NAMA_STORAGE_KERANJANG,
      storage: createJSONStorage(storagePenyimpan),
      // Hanya persist items ke localStorage, state UI dan promo temporer tidak mengotori storage
      partialize: (state) => ({ items: state.items as ItemKeranjang[] }),
    }
  )
);

// Selektor untuk reaktivitas optimal
export const selectTotalItem = (state: CartState) =>
  state.items.reduce((acc, item) => acc + item.quantity, 0);

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

export const selectTotalAkhir = (state: CartState) => {
  const sub = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const diskon = hitungDiskonPromo(sub, state.appliedPromo);
  return Math.max(0, sub - diskon);
};

export const selectItems = (state: CartState) => state.items;
export const selectTerbuka = (state: CartState) => state.terbuka;
export const selectAppliedPromo = (state: CartState) => state.appliedPromo;
