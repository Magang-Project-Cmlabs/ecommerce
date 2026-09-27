# Glosarium — TokoKita

Satu konsep, satu nama. Kolom **Kode / DB** adalah nama yang dipakai di Prisma,
TypeScript, dan URL. Kolom **Label UI** adalah teks yang dilihat pembeli/admin.
Semua label diambil dari satu peta konstanta di `src/lib/constants.ts`, jangan
ditulis ulang per halaman.

## 1. Istilah domain

| Istilah | Kode / DB | Arti |
|---|---|---|
| Pembeli | `role = 'customer'` | Pengguna yang berbelanja. Bukan "user" atau "member" di UI. |
| Admin | `role = 'admin'` | Pemilik atau staf toko. |
| Tamu | (tanpa sesi) | Pengunjung belum login; boleh melihat produk dan mengisi keranjang. |
| Produk | `products` | Barang yang dijual. |
| Varian | `product_variants` | Pilihan ukuran/warna. Label pilihannya dari `products.variant_label` (mis. "Ukuran"). |
| Stok | `stock` | Jumlah tersedia. Produk bervarian memakai stok varian; `products.stock` hanya total. |
| Pre-order | `is_preorder` | Boleh dipesan saat stok 0, dengan label estimasi kirim. |
| Arsip | `is_active = false` | Produk disembunyikan, tidak dihapus, agar riwayat pesanan utuh. |
| Keranjang | `cart-store` | Isi belanja di localStorage; bukan tabel DB. |
| Pesanan | `orders` | Hasil checkout. Bukan "transaksi" atau "invoice" di kode. |
| Nomor pesanan | `order_number` | Format `INV-{TAHUN}{BULAN}-{0001}`, urutan direset tiap bulan. |
| Item pesanan | `order_items` | Salinan nama, varian, gambar, harga, dan berat saat pesanan dibuat. |
| Alamat kirim | `orders.shipping_address` | Salinan JSON alamat saat pesanan dibuat. |
| Ongkir | `shipping_cost` | Ongkos kirim, dihitung dari total berat. |
| Kode promo | `promo_codes.code` | Maksimal satu per pesanan; memotong subtotal, bukan ongkir. |
| Kuota promo | `quota`, `used_count` | Batas total pemakaian; dikembalikan saat pesanan batal. |
| Batas bayar | `payment_due_at` | 24 jam setelah pesanan dibuat (selain COD). |
| Resi | `tracking_number` | Nomor pelacakan kurir; wajib saat status jadi `shipped`. |
| Log status | `order_status_logs` | Jejak setiap perubahan status, sumber timeline pesanan. |
| Pembeli Terverifikasi | `reviews.order_item_id` | Badge ulasan; hanya dari item pesanan berstatus `delivered`. |
| Stok menipis | `stock <= 5` | Peringatan di dasbor admin. |

## 2. Status pesanan (PRD §19)

| DB (`orders.status`) | Label UI |
|---|---|
| `pending` | Menunggu Pembayaran |
| `confirmed` | Dikonfirmasi |
| `packed` | Dikemas |
| `shipped` | Dikirim |
| `delivered` | Selesai |
| `cancelled` | Dibatalkan |

## 3. Status pembayaran

| DB (`orders.payment_status`) | Label UI |
|---|---|
| `unpaid` | Belum Dibayar |
| `paid` | Lunas |
| `refunded` | Dikembalikan |

Label status pembayaran tidak ditulis di PRD; di atas adalah usulan. Ubah di sini
dan di `constants.ts` bersamaan.

## 4. Ketersediaan produk (PRD §19)

| Kondisi | Label UI |
|---|---|
| stok > 0 | Tersedia |
| stok = 0, bukan pre-order | Habis |
| `is_preorder = true` | Pre-order |

## 5. Kurir dan pembayaran

Kode di bawah **sudah dikunci** sebagai enum database `PaymentMethod` dan
`ShippingMethod` di `prisma/schema.prisma` (migration `20260927072940_init`).
Mengganti atau menambah kode = migration baru. Label UI tetap dari
`src/lib/constants.ts`.

| Kode | Label UI | Aturan |
|---|---|---|
| `jne_reg` | JNE Regular | Rp 15.000/kg, 2-3 hari |
| `sicepat_reg` | SiCepat REG | Rp 13.000/kg, 1-2 hari |
| `gosend_instant` | GoSend Instant | Rp 30.000 flat, kota sama dengan `STORE_CITY`, berat ≤ 20 kg |
| `qris` | QRIS (GoPay, OVO, DANA) | Batas bayar 24 jam |
| `bank_bca` | Transfer Bank BCA | Batas bayar 24 jam |
| `bank_mandiri` | Transfer Bank Mandiri | Batas bayar 24 jam |
| `cod` | Bayar di Tempat (COD) | Langsung `confirmed`, `unpaid` |

Metode yang dibayar lewat Midtrans Snap (sandbox, D9) dan kanal yang dibuka:
`qris` → `gopay`, `other_qris` · `bank_bca` → `bca_va` · `bank_mandiri` →
`echannel` (Mandiri Bill Payment). COD tidak lewat gateway. Sumber:
`src/lib/payment/midtrans.ts`.

| Istilah | Kode | Arti |
|---|---|---|
| Sesi bayar | `SesiBayar` | Token + URL halaman Snap untuk satu percobaan bayar |
| Percobaan bayar | `payment_attempt` | Ke-n kali pembeli membuka sesi bayar; id transaksi `INV-…~n` untuk n ≥ 2 |
| Id transaksi gateway | `payment_transaction_id` | `order_id` di Midtrans; sama dengan nomor pesanan pada percobaan pertama |
| Notifikasi | webhook | Kabar status dari Midtrans ke `/api/payment/midtrans` |

## 6. Format

| Hal | Contoh | Catatan |
|---|---|---|
| Mata uang | `Rp 89.000` | Titik pemisah ribuan, tanpa desimal |
| Tanggal | `23 Sep 2026, 14.30 WIB` | date-fns locale `id`, zona `Asia/Jakarta` |
| Hemat | `-31%` / `Hemat 31%` | Dari `compare_at_price` |
