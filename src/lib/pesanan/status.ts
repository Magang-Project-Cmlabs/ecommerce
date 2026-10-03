// Aturan mesin status pesanan TokoKita (PRD §10.6, CLAUDE.md aturan keras #8).
// Fungsi murni tanpa ketergantungan Prisma, aman dipanggil di client maupun server.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type PelakuTransisi = 'pembeli' | 'admin' | 'sistem';

export const LABEL_STATUS_PESANAN: Record<OrderStatus, string> = {
  pending: 'Menunggu Pembayaran',
  confirmed: 'Dikonfirmasi',
  packed: 'Dikemas',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const LABEL_STATUS_PEMBAYARAN: Record<PaymentStatus, string> = {
  unpaid: 'Belum Dibayar',
  paid: 'Lunas',
  refunded: 'Dikembalikan',
};

export type MetodePembayaran = 'qris' | 'bank_bca' | 'bank_mandiri' | 'cod';

export const LABEL_METODE_PEMBAYARAN: Record<MetodePembayaran, string> = {
  qris: 'QRIS',
  bank_bca: 'Transfer Bank BCA',
  bank_mandiri: 'Transfer Bank Mandiri',
  cod: 'Bayar di Tempat (COD)',
};

/** Label metode pembayaran untuk tampilan; kode tak dikenal tetap terbaca. */
export const labelMetodePembayaran = (kode: string) =>
  LABEL_METODE_PEMBAYARAN[kode as MetodePembayaran] ?? kode.replaceAll('_', ' ');

/**
 * Validasi apakah transisi dari status asal ke status tujuan diizinkan untuk pelaku terkait (PRD §10.6).
 */
export function transisiStatusBoleh(
  dari: OrderStatus,
  ke: OrderStatus,
  pelaku: PelakuTransisi
): boolean {
  if (dari === ke) return false;

  switch (dari) {
    case 'pending':
      if (ke === 'confirmed') return pelaku === 'sistem' || pelaku === 'admin';
      if (ke === 'cancelled') return true; // pembeli, admin, dan sistem boleh membatalkan pending
      return false;

    case 'confirmed':
      if (ke === 'packed') return pelaku === 'admin';
      if (ke === 'cancelled') return pelaku === 'admin';
      return false;

    case 'packed':
      if (ke === 'shipped') return pelaku === 'admin';
      return false;

    case 'shipped':
      if (ke === 'delivered') return pelaku === 'pembeli' || pelaku === 'sistem';
      return false;

    case 'delivered':
    case 'cancelled':
      return false; // Status terminal

    default:
      return false;
  }
}
