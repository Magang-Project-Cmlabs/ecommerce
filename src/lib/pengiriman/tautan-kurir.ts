// Halaman lacak resmi kurir (gratis, tanpa API). Formulir JNE memakai POST + token,
// jadi resi tidak bisa diisikan lewat URL; resi disalin otomatis saat tombol diklik.
// GoSend tidak punya halaman lacak web (dipantau di aplikasi Gojek).
import type { KurirKode } from '@/lib/pesanan/ongkir';

export type HalamanLacak = { label: string; url: string; catatan?: string };

const HALAMAN: Partial<Record<KurirKode, HalamanLacak>> = {
  // JNE meminta 5 digit terakhir telepon penerima sebelum menampilkan detail (dicek 3 Okt 2026).
  jne_reg: { label: 'JNE', url: 'https://www.jne.co.id/tracking-package', catatan: 'JNE akan meminta 5 digit terakhir nomor telepon penerima.' },
  sicepat_reg: { label: 'SiCepat', url: 'https://www.sicepat.com/' },
};

export const halamanLacakKurir = (kurir: string): HalamanLacak | null => HALAMAN[kurir as KurirKode] ?? null;
