# Runbook — Payment Gateway Midtrans (Sandbox)

Status: **modul siap dan teruji di `src/lib/payment/`, belum tersambung ke
aplikasi** (aplikasi belum di-scaffold). Keputusan dan batasannya:
[`../OPEN_DECISIONS.md`](../OPEN_DECISIONS.md) D9.

> PRD §21 semula menaruh payment gateway di luar cakupan karena Midtrans
> mensyaratkan badan usaha (PT/CV) untuk transaksi sungguhan. Mode **sandbox**
> tidak mensyaratkannya, jadi fitur ini dibangun dan didemokan dengan uang
> simulasi. Rilis production tetap butuh akun Midtrans milik badan usaha.

## 1. Alur

```
Pembeli: "Bayar Sekarang" (pesanan pending, metode qris/bank_bca/bank_mandiri)
  → server action: klien.buatSesi(pesanan)      → simpan idTransaksi, token, url
  → redirect ke halaman Snap Midtrans            (pembeli membayar di sandbox)
  → Midtrans POST notifikasi ke /api/payment/midtrans
  → tanganiNotifikasiMidtrans(body, deps)
      signature → pesanan → status diambil ulang dari API → jumlah cocok
      → konfirmasiBayar()  : pending → confirmed, paid        (via ubahStatus)
      → batalkanOtomatis() : pending → cancelled, stok kembali (via ubahStatus)
  → pembeli kembali ke /akun/pesanan/[nomor] (callbacks.finish)
```

COD tidak pernah lewat gateway. Cron batal otomatis 24 jam (PRD §10.6) tetap
berjalan; sesi Snap sengaja berakhir tepat di `payment_due_at`.

## 2. Isi modul

| Berkas | Isi |
|---|---|
| `types.ts` | Kontrak: `PesananUntukBayar`, `SesiBayar`, `StatusGateway`, `AksiPesanan` |
| `midtrans.ts` | Konfigurasi, body Snap, klien HTTP (`buatSesi`, `ambilStatus`), verifikasi signature |
| `status.ts` | `tentukanAksi()` — status Midtrans → konfirmasi / batalkan / abaikan |
| `notifikasi.ts` | `tanganiNotifikasiMidtrans()` — logika webhook, dependensi disuntikkan |
| `*.test.ts` | 65 unit test (`npm run test`) |

Keputusan desain yang perlu diketahui:
- **Tanpa SDK** `midtrans-client`; cukup `fetch` dengan batas waktu 10 detik.
- **Notifikasi tidak dipercaya begitu saja.** Setelah signature cocok, status
  diambil ulang lewat API Status Midtrans, lalu jumlahnya dicocokkan dengan
  `grand_total` di database.
- **Bayar ulang.** `order_id` Midtrans hanya bisa dipakai sekali. Setelah
  deny/cancel/failure, percobaan berikutnya memakai `INV-202609-0001~2`, `~3`, dst.
  Kedaluwarsanya percobaan lama tidak membatalkan pesanan.
- **Uang masuk untuk pesanan yang sudah batal** (dibayar tepat saat cron
  membatalkan) tidak mengubah apa pun; dicatat level `error` untuk refund manual
  oleh admin.
- Ongkir dan diskon dikirim sebagai baris `item_details` tersendiri (diskon
  bernilai negatif) agar jumlahnya sama dengan `gross_amount`.

## 3. Menyiapkan akun sandbox

1. Daftar di https://dashboard.midtrans.com, pilih lingkungan **Sandbox**.
2. *Settings → Access Keys*: salin **Server Key** (berawalan `SB-Mid-server-`).
3. Isi `.env`:
   ```env
   MIDTRANS_SERVER_KEY="SB-Mid-server-..."
   MIDTRANS_IS_PRODUCTION="false"
   ```
4. *Settings → Payment → Notification URL*:
   `https://<alamat-publik>/api/payment/midtrans`. Midtrans tidak bisa memanggil
   `localhost`; saat development pakai tunnel (mis. Cloudflare Tunnel atau
   ngrok) ke port 3000.

Server key hanya di server. Jangan pernah memakai prefiks `NEXT_PUBLIC_` untuknya.

## 4. Menyambungkan ke aplikasi (setelah scaffold dan tabel `orders` ada)

**a. Skema** — tambahkan ke `orders` lewat migration baru (di luar 15 tabel
PRD, lihat D9):

| Kolom | Tipe | Guna |
|---|---|---|
| `payment_attempt` | INT default 0 | nomor percobaan terakhir |
| `payment_transaction_id` | VARCHAR(64) NULL | id transaksi Midtrans percobaan aktif |
| `payment_url` | VARCHAR(255) NULL | URL Snap, dipakai ulang selama masih berlaku |
| `payment_type` | VARCHAR(32) NULL | kanal yang dipakai pembeli (bank_transfer, gopay, qris…) |

**b. Server action "Bayar Sekarang"** (`src/actions/payment.ts`):
`requireUser()` → pesanan milik pembeli, `status = pending`, metode gateway,
belum lewat batas bayar → bila `payment_url` masih ada, pakai ulang; bila
tidak, `payment_attempt + 1`, `klien.buatSesi(...)` dengan item dari
`order_items` (snapshot), simpan kolom di atas → `redirect(urlBayar)`.

**c. Route handler** `src/app/api/payment/midtrans/route.ts`: bungkus
`tanganiNotifikasiMidtrans` seperti contoh di kepala `notifikasi.ts`. `deps`:
`cariPesanan` membaca kolom di atas, `ambilStatus` = `klien.ambilStatus`,
`konfirmasiBayar` / `batalkanOtomatis` memanggil **`ubahStatus()`** (skill
`tokokita-pesanan`) — jangan menulis status langsung. Email "Pembayaran
diterima" dikirim setelah transaksi commit.

**d. Tombol "Bayar Sekarang"** di `/akun/pesanan/[nomor]` menggantikan tombol
simulasi PRD §7.7 untuk metode gateway.

## 5. Menguji di sandbox

- Unit test: `npm run test` (tanpa jaringan).
- Pembayaran palsu: buka URL Snap, pilih metode, lalu selesaikan lewat
  simulator sandbox Midtrans (https://simulator.sandbox.midtrans.com) dengan
  nomor VA / kode QR dari halaman Snap.
- Periksa: status pesanan jadi Dikonfirmasi, `order_status_logs` bertambah satu,
  notifikasi kedua untuk transaksi yang sama menghasilkan `sudah-diproses`.
- Kedaluwarsa: buat sesi lalu biarkan lewat batas (atau batalkan transaksi dari
  dashboard sandbox) → pesanan Dibatalkan, stok kembali.

Uji integrasi otomatis ke sandbox (butuh `MIDTRANS_SERVER_KEY` di `.env`):

```bash
npm run test:sandbox -- -t buat   # buat sesi, cetak link Snap
# buka link -> BCA Virtual Account -> bayar di simulator sandbox
npm run test:sandbox -- -t cek    # status dari Midtrans + handler webhook
```

## 6. Hasil verifikasi

| Hal | Status | Bukti / alasan |
|---|---|---|
| Unit test modul (65 kasus) | PASS | `npm run test` |
| Membuat sesi Snap dengan kunci sandbox asli (ongkir + diskon negatif) | PASS | 27 Sep 2026, `UJI-1790477305694`, Rp 324.300 |
| Pembayaran BCA VA di simulator sandbox → status `settlement`, jumlah cocok | PASS | 27 Sep 2026, `ambilStatus` sungguhan |
| Handler webhook dengan status dari API asli: dikonfirmasi sekali, notifikasi ulang `sudah-diproses`, signature palsu 401 | PASS | 27 Sep 2026, `npm run test:sandbox -- -t cek` |
| Kanal `other_qris`/`gopay` dan `echannel` (Mandiri) | NOT_RUN | Baru BCA VA yang dicoba |
| Notifikasi dikirim server Midtrans ke route handler lewat internet | NOT_RUN | Route handler belum ada (aplikasi belum di-scaffold), butuh tunnel |
| Kedaluwarsa (`expire`) membatalkan pesanan | NOT_RUN | Baru teruji di unit test |
