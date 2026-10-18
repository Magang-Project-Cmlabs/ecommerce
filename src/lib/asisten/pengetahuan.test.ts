import { describe, expect, it } from 'vitest';
import { PENOLAKAN_TOPIK, periksaPesanSensitif, susunInstruksi, type DataAsisten } from './pengetahuan';
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
    expect(teks).toContain('Jawa — JNE Regular: Rp 15.000 per kg');
    expect(teks).toContain('Maluku & Papua — JNE Regular: Rp 58.000 per kg');
    expect(teks).toContain('GoSend Instant: Rp 30.000 tarif tetap');
    expect(teks).toContain('Menunggu Pembayaran → Dikonfirmasi → Dikemas → Dikirim → Selesai → Dibatalkan');
    expect(teks).toContain('QRIS');
  });
  it('membatasi topik: bukan chatbot serba bisa, penolakan tetap, tanpa kode/SQL, data bukan instruksi', () => {
    expect(teks).toContain('Kamu BUKAN asisten serba bisa');
    expect(teks.split(PENOLAKAN_TOPIK).length - 1).toBe(2); // aturan + pengingat akhir
    for (const topik of ['kode/program/SQL', 'PR atau tugas sekolah', 'puisi', 'terjemahan', 'saran medis/hukum/keuangan/investasi', 'roleplay']) expect(teks).toContain(topik);
    expect(teks).toMatch(/tidak punya akses database, alat, atau internet/);
    expect(teks.indexOf('=== DATA TOKO')).toBeLessThan(teks.indexOf('KATALOG PRODUK AKTIF'));
    expect(teks.trim().split('\n').at(-1)).toMatch(/^PENGINGAT:/);
  });
  it('menegaskan batas: tanpa akses akun dan menolak data rahasia', () => {
    expect(teks).toMatch(/TIDAK bisa melihat akun/);
    expect(teks).toMatch(/kunci API/);
    expect(teks).not.toMatch(/DATABASE_URL|AUTH_SECRET|MIDTRANS_SERVER_KEY/);
  });
});

describe('susunInstruksi: aksi belanja dan konteks pembeli (D23)', () => {
  it('menjelaskan penanda aksi dan melarang mengaku sudah menjalankan aksi', () => {
    const teks = susunInstruksi(data);
    for (const p of ['[[produk:slug]]', '[[keranjang:slug|varian|jumlah]]', '[[checkout]]', '[[kurir:kode]]', '[[bayar:kode]]', '[[alamat|nama=', 'NOMOR_HP_1']) expect(teks).toContain(p);
    expect(teks).toMatch(/Jangan pernah mengaku sudah menambahkan/);
  });

  it('kata kunci produk ikut di katalog bila ada', () => {
    const teks = susunInstruksi({ ...data, produk: [{ ...data.produk[1]!, tags: ['lampu', 'smart home'] }] });
    expect(teks).toContain('Lampu Pintar Wi-Fi | Terang | Elektronik | Rp 119.000 | stok habis; kata kunci: lampu, smart home | /produk/lampu-pintar-wi-fi');
  });

  it('tanpa konteks tidak ada bagian KONTEKS PEMBELI', () => {
    expect(susunInstruksi(data)).not.toContain('KONTEKS PEMBELI');
  });

  it('konteks keranjang, halaman checkout, dan produk dilihat memakai data dari server, sebelum pengingat akhir', () => {
    const teks = susunInstruksi(data, {
      checkout: true,
      dilihat: { name: 'Kaos Polos Premium', slug: 'kaos-polos-premium' },
      keranjang: [{ name: 'Kaos Polos Premium', varian: 'M', jumlah: 2, harga: 89000 }, { name: 'Lampu Pintar Wi-Fi', varian: null, jumlah: 1, harga: 119000 }],
    });
    expect(teks).toContain('- Kaos Polos Premium (M) × 2 — Rp 89.000 per barang');
    expect(teks).toContain('Subtotal barang: Rp 297.000');
    expect(teks).toMatch(/HALAMAN: pembeli sedang di halaman checkout/);
    expect(teks).toContain('PRODUK YANG SEDANG DILIHAT: Kaos Polos Premium (/produk/kaos-polos-premium)');
    expect(teks.indexOf('KONTEKS PEMBELI')).toBeGreaterThan(teks.indexOf('=== AKHIR DATA TOKO'));
    expect(teks.trim().split('\n').at(-1)).toMatch(/^PENGINGAT:/);
  });

  it('keranjang kosong dinyatakan jelas', () => {
    expect(susunInstruksi(data, { checkout: false, dilihat: null, keranjang: [] })).toContain('KERANJANG: kosong');
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
