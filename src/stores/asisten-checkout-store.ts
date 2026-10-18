// Jembatan asisten → checkout (D23). Panel asisten menitipkan satu perintah (pilih kurir, pilih
// pembayaran, atau isi draf alamat) setelah pembeli menekan tombolnya; CheckoutWizard menjalankan
// lalu menghapusnya. Disimpan di sessionStorage agar tetap ada setelah pindah ke /checkout atau
// setelah dialihkan ke halaman masuk. Hanya isian formulir: penyimpanan tetap lewat Server Action.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { TARIF_KURIR, type KurirKode } from '@/lib/pesanan/ongkir';
import { LABEL_BAYAR, type DrafAlamat, type MetodeBayarAsisten } from '@/lib/asisten/aksi';

export type PerintahCheckout =
  | { id: number; jenis: 'kurir'; kode: KurirKode }
  | { id: number; jenis: 'bayar'; kode: MetodeBayarAsisten }
  | { id: number; jenis: 'alamat'; data: DrafAlamat };

/** Perintah lebih tua dari ini dibuang: pembeli mungkin sudah berubah pikiran. */
export const UMUR_MAKS_PERINTAH_MS = 5 * 60 * 1000;

const KOLOM_ALAMAT = new Set(['label', 'name', 'phone', 'street', 'district', 'city', 'province', 'postalCode']);

/** Isi sessionStorage tidak dipercaya: periksa bentuk, kode, dan umur perintah sebelum dijalankan. */
export function perintahSah(p: unknown, sekarang = Date.now()): p is PerintahCheckout {
  if (!p || typeof p !== 'object') return false;
  const { id, jenis, kode, data } = p as Record<string, unknown>;
  if (typeof id !== 'number' || sekarang - id > UMUR_MAKS_PERINTAH_MS || id > sekarang + 1000) return false;
  if (jenis === 'kurir') return typeof kode === 'string' && Object.hasOwn(TARIF_KURIR, kode);
  if (jenis === 'bayar') return typeof kode === 'string' && Object.hasOwn(LABEL_BAYAR, kode);
  if (jenis !== 'alamat' || !data || typeof data !== 'object') return false;
  return Object.entries(data).every(([k, v]) => KOLOM_ALAMAT.has(k) && typeof v === 'string' && v.length <= 255);
}

type SebarkanJenis<T> = T extends unknown ? Omit<T, 'id'> : never;
export type PerintahBaru = SebarkanJenis<PerintahCheckout>;

type State = {
  perintah: PerintahCheckout | null;
  kirim: (p: PerintahBaru) => void;
  selesai: (id: number) => void;
};

export const useAsistenCheckout = create<State>()(persist((set, get) => ({
  perintah: null,
  kirim: (p) => set({ perintah: { ...p, id: Date.now() } as PerintahCheckout }),
  selesai: (id) => { if (get().perintah?.id === id) set({ perintah: null }); },
}), {
  name: 'tokokita-asisten-checkout',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (s) => ({ perintah: s.perintah }),
}));
