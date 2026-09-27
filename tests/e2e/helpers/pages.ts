// Daftar halaman yang disapu tes navigasi, aksesibilitas, dan responsif.
//
// Diambil dari PRD §7-8. Menambah halaman baru cukup menambah satu baris di
// sini. Halaman yang belum dibuat diberi `belumAda: true` supaya dilewati
// dengan alasan jelas, bukan gagal; hapus tandanya begitu halaman selesai.

export type Halaman = {
  path: string;
  judul: string;
  /** Halaman belum dibangun; tes dilewati. */
  belumAda?: boolean;
};

export const HALAMAN_PUBLIK: Halaman[] = [
  { path: '/', judul: 'Beranda', belumAda: true },
  { path: '/produk', judul: 'Daftar Produk', belumAda: true },
  { path: '/masuk', judul: 'Masuk' },
  { path: '/daftar', judul: 'Daftar' },
  { path: '/lupa-password', judul: 'Lupa Password' },
  // Tanpa token menampilkan "Link tidak berlaku"; alur lengkap di lupa-password.spec.ts.
  { path: '/reset-password', judul: 'Reset Password' },
  { path: '/kebijakan-privasi', judul: 'Kebijakan Privasi', belumAda: true },
  { path: '/syarat-ketentuan', judul: 'Syarat & Ketentuan', belumAda: true },
  { path: '/bantuan', judul: 'Bantuan', belumAda: true },
];

export const HALAMAN_PEMBELI: Halaman[] = [
  { path: '/akun', judul: 'Akun' },
  { path: '/akun/pesanan', judul: 'Pesanan Saya', belumAda: true },
  { path: '/wishlist', judul: 'Wishlist' },
];

export const HALAMAN_ADMIN: Halaman[] = [
  { path: '/admin', judul: 'Ringkasan' },
  { path: '/admin/pesanan', judul: 'Pesanan', belumAda: true },
  { path: '/admin/produk', judul: 'Produk', belumAda: true },
  { path: '/admin/kategori', judul: 'Kategori', belumAda: true },
  { path: '/admin/promo', judul: 'Promo', belumAda: true },
  { path: '/admin/banner', judul: 'Banner', belumAda: true },
];

// Halaman yang wajib mengalihkan tamu ke /masuk?next=... (PRD §12).
export const HALAMAN_TERLINDUNGI: Halaman[] = [
  { path: '/checkout', judul: 'Checkout' },
  { path: '/akun', judul: 'Akun' },
  // Halamannya belum ada, tetapi proxy.ts sudah mengalihkan seluruh prefix /akun.
  { path: '/akun/pesanan', judul: 'Pesanan Saya' },
  { path: '/wishlist', judul: 'Wishlist' },
  { path: '/admin', judul: 'Admin' },
];
