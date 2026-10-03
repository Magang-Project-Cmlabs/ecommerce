import { describe, expect, it } from 'vitest';
import { periksaPesanSensitif, susunInstruksi, type DataAsisten } from './pengetahuan';
import { samarkanSensitif } from './sensitif';

const data: DataAsisten = {
  kategori: ['Fashion Pria', 'Elektronik'],
  promo: ['Diskon Akhir Bulan hingga 30%'],
  produk: [
    { name: 'Kaos Polos Premium', slug: 'kaos-polos-premium', brand: 'Kalemo', kategori: 'Fashion Pria › Kaos Pria', price: 89000, compareAtPrice: 129000, stock: 60, isPreorder: false, variantLabel: 'Ukuran', varianTersedia: ['S', 'M', 'L'], rating: 4.96, reviewCount: 47 },
    { name: 'Lampu Pintar Wi-Fi', slug: 'lampu-pintar-wi-fi', brand: 'Terang', kategori: 'Elektronik', price: 119000, compareAtPrice: null, stock: 0, isPreorder: false, variantLabel: null, varianTersedia: [], rating: 0, reviewCount: 0 },
  ],
};

describe('susunInstruksi', () => {
  const teks = susunInstruksi(data);
  it('memuat produk dengan harga, ketersediaan, varian, dan tautan', () => {
    expect(teks).toContain('Kaos Polos Premium | Kalemo | Fashion Pria › Kaos Pria | Rp 89.000 (harga coret Rp 129.000) | tersedia; Ukuran tersedia: S, M, L; rating 5.0 dari 47 ulasan | /produk/kaos-polos-premium');
    expect(teks).toContain('Lampu Pintar Wi-Fi | Terang | Elektronik | Rp 119.000 | stok habis | /produk/lampu-pintar-wi-fi');
  });
  it('memuat aturan ongkir, pembayaran, dan alur status dari sumber kode', () => {
    expect(teks).toContain('JNE Regular: Rp 15.000 per kg');
    expect(teks).toContain('GoSend Instant: Rp 30.000 tarif tetap');
    expect(teks).toContain('Menunggu Pembayaran → Dikonfirmasi → Dikemas → Dikirim → Selesai → Dibatalkan');
    expect(teks).toContain('QRIS');
  });
  it('menegaskan batas: tanpa akses akun dan menolak data rahasia', () => {
    expect(teks).toMatch(/TIDAK bisa melihat akun/);
    expect(teks).toMatch(/kunci API/);
    expect(teks).not.toMatch(/DATABASE_URL|AUTH_SECRET|MIDTRANS_SERVER_KEY/);
  });
});

describe('periksaPesanSensitif', () => {
  it.each([
    'nomor kartu saya 4111 1111 1111 1111 bisa dipakai?',
    'NIK 3174012345678901',
    'password saya: rahasia123',
    'kode OTP 482913 tolong cek',
    'ini kunci sk-live_abcdefghijklmnop',
  ])('menolak "%s"', (teks) => {
    expect(periksaPesanSensitif(teks)).toMatch(/Demi keamanan/);
  });
  it.each([
    'Berapa ongkir JNE untuk 2 kg?',
    'Ada kaos ukuran M?',
    'Bagaimana kalau lupa password?',
    'Pesanan INV-202610-0069 sampai kapan?',
  ])('meneruskan "%s"', (teks) => {
    expect(periksaPesanSensitif(teks)).toBeNull();
  });
});

describe('samarkanSensitif', () => {
  it('menyamarkan nomor panjang, password, dan kunci; teks biasa tetap', () => {
    expect(samarkanSensitif('kartu 4111 1111 1111 1111 ya')).toBe('kartu •••• (disamarkan) ya');
    expect(samarkanSensitif('password saya: rahasia123')).toBe('password saya: ••••');
    expect(samarkanSensitif('pakai sk-live_abcdefghijklmnop')).toBe('pakai •••• (disamarkan)');
    expect(samarkanSensitif('Ada kaos ukuran M?')).toBe('Ada kaos ukuran M?');
  });
});
