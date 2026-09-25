# Naskah Demo — TokoKita (± 7 menit)

Sumber: Presentasi slide 19, kartu *A5 · Hari 6 · Siapkan dan latih demo 7 menit*.

## Persiapan (sebelum demo, bukan saat demo)

- [ ] `npm run db:reset` → data demo segar (PRD §20)
- [ ] Jalankan mode production: `npm run build && npm run start`
- [ ] Dua jendela browser: pembeli (`demo@tokokita.id`) dan admin
      (`admin@tokokita.id`), keduanya sudah login
- [ ] Satu pesanan contoh sudah lewat batas bayar (dari seed atau dengan
      memanggil job cron — lihat OPEN_DECISIONS D7)
- [ ] Email pesanan bisa ditunjukkan (kotak masuk atau konsol/Mailpit)
- [ ] Layar HP / emulasi perangkat siap untuk menunjukkan tampilan mobile

## Skenario

| Menit | Adegan | Yang ditunjukkan |
|---|---|---|
| 0:00 | Pembuka | Beranda di HP: banner, kategori, produk terlaris |
| 0:45 | 1. Cari & pilih | Ketik 2 huruf → saran; filter; detail produk; pilih varian (harga & stok berubah, varian habis terkunci) |
| 2:00 | 2. Checkout | Keranjang → kode promo `HEMAT10` → 4 langkah → halaman sukses dengan nomor pesanan & batas bayar |
| 3:30 | 3. Admin | Dasbor (pesanan hari ini, stok menipis) → konfirmasi pembayaran → Dikemas → input resi → Dikirim |
| 5:00 | 4. Pembeli menerima | Timeline status → "Pesanan Diterima" → beri ulasan (badge Pembeli Terverifikasi) |
| 6:00 | 5. Batal otomatis | Pesanan lewat batas bayar jadi Dibatalkan; stok dan kuota promo kembali |
| 6:45 | Penutup | Kriteria sukses yang tercapai |

## Kalau ada yang gagal saat demo

Jangan memperbaiki kode di depan penonton. Pindah ke adegan berikutnya dan
jelaskan singkat. Siapkan rekaman layar cadangan dari latihan terakhir.
