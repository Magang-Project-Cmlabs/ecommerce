// Kontrak modul pembayaran TokoKita.
//
// Modul ini tidak mengenal Prisma. Pemanggil (server action / route handler)
// menyerahkan data pesanan yang sudah dibaca dari database, lalu menjalankan
// aksi yang dikembalikan modul lewat fungsi transisi status pesanan.

/** Metode bayar yang lewat gateway. COD tidak pernah lewat gateway. */
export type MetodeGateway = 'qris' | 'bank_bca' | 'bank_mandiri';

export type ItemPesanan = {
  /** id produk/varian, dipakai sebagai item_details.id */
  id: string;
  /** Snapshot nama + varian dari order_items */
  nama: string;
  /** Rupiah, INT */
  harga: number;
  jumlah: number;
};

/** Data pesanan yang dibutuhkan untuk membuka sesi bayar. Semua angka dari DB. */
export type PesananUntukBayar = {
  nomorPesanan: string;
  /** Percobaan bayar ke-n. 1 untuk yang pertama. Lihat idTransaksiGateway(). */
  percobaan: number;
  metode: MetodeGateway;
  items: ItemPesanan[];
  ongkir: number;
  diskon: number;
  grandTotal: number;
  dibuatPada: Date;
  batasBayar: Date;
  pelanggan: { nama: string; email: string; telepon?: string };
  /** URL halaman detail pesanan, tujuan setelah pembeli selesai di halaman gateway */
  urlSelesai: string;
};

export type SesiBayar = {
  idTransaksi: string;
  token: string;
  urlBayar: string;
};

/** Status transaksi menurut gateway, sudah dinormalkan. */
export type StatusGateway = {
  idTransaksi: string;
  transactionStatus: string;
  fraudStatus?: string;
  statusCode: string;
  /** Rupiah, INT (sudah dikonversi dari "150000.00") */
  jumlah: number;
  paymentType?: string;
};

/**
 * Keputusan untuk pesanan setelah membaca status gateway.
 * - konfirmasi: pending -> confirmed, payment_status = paid
 * - batalkan: pending -> cancelled oleh sistem (stok & kuota promo kembali)
 * - abaikan: tidak ada perubahan status pesanan
 */
export type AksiPesanan =
  | { jenis: 'konfirmasi'; paymentType?: string }
  | { jenis: 'batalkan'; alasan: string }
  | { jenis: 'abaikan'; alasan: string; /** status tak dikenal: catat level error */ perluDiperiksa?: boolean };
