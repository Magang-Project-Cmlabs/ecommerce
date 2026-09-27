---
name: tokokita-pesanan
description: Aturan bisnis inti TokoKita yang menyangkut uang dan stok - ongkir berdasarkan berat, validasi dan hitungan kode promo, pembuatan pesanan dalam transaksi, mesin status pesanan, pembatalan otomatis, dan ulasan. Pakai (dengan TDD) setiap kali menulis atau mengubah checkout, promo, ongkir, status pesanan, job cron, atau ulasan.
---

# Aturan Pesanan TokoKita

Sumber: PRD §10. Skill ini merangkum invarian dan kasus uji; bila berbeda, PRD
yang benar. Logika murni (ongkir, promo, transisi) ditulis sebagai fungsi tanpa
Prisma di `src/lib/` dan **test ditulis lebih dulu**.

## 1. Ongkir (PRD §10.3)

```
kg = max(1, ceil(totalBeratGram / 1000))
jne_reg        = 15_000 × kg
sicepat_reg    = 13_000 × kg
gosend_instant = 30_000 flat; hanya jika kota alamat == STORE_CITY dan totalBerat ≤ 20_000 g
```

Kasus uji: 1 g → 1 kg · 1000 g → 1 kg · 1001 g → 2 kg · 20_000 g GoSend boleh ·
20_001 g GoSend ditolak · kota beda GoSend ditolak · perbandingan kota tidak peka
huruf besar/spasi.

## 2. Kode promo (PRD §10.4)

Valid jika **semua** benar: `is_active` · `starts_at ≤ sekarang ≤ expires_at` ·
`quota` null atau `used_count < quota` · pemakaian pengguna `< per_user_limit` ·
`subtotal ≥ min_subtotal`.

```
PERCENT: diskon = floor(subtotal × value / 100), lalu min(diskon, max_discount ?? ∞)
FIXED:   diskon = value
diskon  = min(diskon, subtotal)        // total tidak boleh negatif
```

- Diskon memotong **subtotal**, tidak pernah ongkir. Jebakan: `ONGKIRFREE` namanya
  "ongkir" tapi di PRD tipenya FIXED Rp 20.000 atas subtotal.
- Maksimal 1 kode per pesanan. Validasi di keranjang hanya pratinjau; checkout
  memvalidasi ulang di transaksi.
- Pesan penolakan spesifik (kedaluwarsa, kuota habis, belum mencapai minimal
  belanja Rp X) — tapi jangan membocorkan apakah kode ada bila tidak aktif.

Kasus uji: tiap syarat gagal sendiri-sendiri · HEMAT10 pada Rp 600.000 → Rp 50.000
(kena batas) · batas per pengguna tercapai · kuota tepat habis.

## 3. Buat pesanan (PRD §10.5) — satu transaksi

1. Ambil harga, berat, stok dari DB (abaikan angka dari client).
2. Tolak jika ada produk tidak aktif, varian wajib belum dipilih, atau stok kurang.
3. Validasi ulang promo dan ketersediaan kurir.
4. `subtotal`, `shipping_cost`, `discount`, `tax = 0`,
   `grand_total = subtotal + shipping_cost − discount`.
5. Kurangi stok **bersyarat** (`updateMany … stock: { gte: qty }`, cek `count`).
6. `sold_count += qty`; catat `promo_usages`, `used_count += 1`.
7. Nomor `INV-YYYYMM-0001`, urutan per bulan (OPEN_DECISIONS D5).
8. Status awal: COD → `confirmed` + `unpaid`; lainnya → `pending` + `unpaid` +
   `payment_due_at = now + 24 jam`.
9. Tulis `order_status_logs`. Email dikirim **setelah** commit, dan kegagalan
   email tidak membatalkan pesanan.

Kasus uji wajib: stok 1 dan dua checkout bersamaan → tepat satu berhasil, stok
akhir 0 (kartu A4 · Hari 5). Harga di keranjang basi → pesanan memakai harga DB
dan pengguna diberi tahu.

## 4. Mesin status (PRD §10.6)

| Dari → Ke | Oleh | Syarat / efek |
|---|---|---|
| pending → confirmed | sistem (bayar) / admin | `payment_status = paid`, `paid_at` |
| pending → cancelled | pembeli / admin / sistem | sistem: lewat `payment_due_at` |
| confirmed → cancelled | admin | alasan wajib; jika `paid` → `refunded` |
| confirmed → packed | admin | — |
| packed → shipped | admin | `tracking_number` wajib, `shipped_at` |
| shipped → delivered | pembeli / sistem | sistem: 7 hari setelah `shipped_at`; COD → `paid`; `delivered_at` |

Selain tabel ini: **tolak**. Satu fungsi `ubahStatus(orderId, ke, pelaku, data)`
yang dipakai semua jalur (action pembeli, action admin, cron).

**Idempoten dan aman balapan.** Pembeli membatalkan tepat saat cron berjalan
tidak boleh mengembalikan stok dua kali. Ubah status bersyarat:

```ts
const res = await tx.order.updateMany({ where: { id, status: dari }, data: { status: ke, … } });
if (res.count !== 1) throw new StatusBerubahError();   // orang lain sudah mengubahnya
// baru setelah ini: kembalikan stok & kuota, tulis log
```

Setiap pembatalan mengembalikan stok, `sold_count`, dan kuota promo.

## 5. Job cron (`GET /api/cron/orders`)

- Tolak tanpa `CRON_SECRET` yang benar (OPEN_DECISIONS D7).
- Batalkan `pending` dengan `payment_due_at < now`; selesaikan `shipped` dengan
  `shipped_at < now − 7 hari`. Proses per pesanan lewat `ubahStatus`, sehingga
  satu kegagalan tidak menghentikan sisanya. Kembalikan ringkasan jumlah.
- Aman dijalankan dua kali berturut-turut (hasil kedua: 0 perubahan).

## 6. Ulasan (PRD §10.7)

Hanya pemilik item pesanan berstatus `delivered`, maksimal 30 hari setelah
`delivered_at`, satu per `order_item_id`. Rating 1-5, teks 10-1000 karakter,
maks. 3 foto. Setelah simpan, hitung ulang `products.rating` (1 desimal) dan
`review_count` di transaksi yang sama.

## 7. Payment gateway (Midtrans sandbox)

Modul `src/lib/payment/` sudah ada dan teruji; panduannya di
`docs/runbooks/payment-midtrans.md`. Webhook tidak mengubah status sendiri:
ia memanggil `konfirmasiBayar` / `batalkanOtomatis` yang wajib diarahkan ke
`ubahStatus()` di §4. Jangan menulis ulang verifikasi signature atau pemetaan
status di tempat lain.

## 8. Selesai berarti

Unit test untuk §1, §2, §4 lulus; tes integrasi konkurensi §3 lulus pada MySQL
sungguhan (bukan mock); laporan status `PASS` / `FAIL` / `NOT_RUN`.
