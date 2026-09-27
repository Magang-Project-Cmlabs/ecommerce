# Keputusan Terbuka — TokoKita

Hal yang tidak dijawab PRD atau perlu dipastikan sebelum dikerjakan. Setiap
butir punya rekomendasi; yang memutuskan adalah ketua tim (A1) kecuali disebut
lain. Setelah diputuskan, pindahkan ke bagian **Sudah diputuskan** beserta
tanggalnya.

Terakhir diperbarui: **25 September 2026**

---

## D1. Versi Next.js — *perlu sebelum scaffold*

- **Konteks:** PRD §12 menyebut `proxy.ts`. Itu nama berkas di Next.js 16; di
  Next.js 15 namanya `middleware.ts`.
- **Rekomendasi:** pakai Next.js versi stabil terbaru (16.x) agar sesuai PRD, lalu
  kunci versinya di `package.json`. Kalau tim memilih 15, ganti semua sebutan
  `proxy.ts` menjadi `middleware.ts` di PRD dan `CLAUDE.md`.

## D2. Versi Prisma dan driver MySQL — *perlu sebelum scaffold*

- **Konteks:** Prisma versi baru mengubah cara konfigurasi (berkas
  `prisma.config.ts`, driver adapter, lokasi pengaturan seed). Panduan lama di
  internet bisa tidak cocok.
- **Rekomendasi:** pakai versi stabil terbaru, ikuti dokumentasi resmi Prisma
  untuk MySQL pada versi itu, kunci versinya, dan catat perintah yang benar di
  `runbooks/database-operations.md`.

## D4. Tempat menyimpan hitungan rate limit login

- **Konteks:** PRD §13 membatasi 5 percobaan/15 menit per IP untuk login dan lupa
  password, tapi skema PRD §9 tidak punya tabel untuk itu.
- **Opsi A (rekomendasi):** `Map` di memori server. Sederhana; syaratnya PM2
  berjalan **satu instance** (mode fork). Hitungan hilang saat restart — dapat
  diterima.
- **Opsi B:** tabel `login_attempts`. Tahan restart dan multi-instance, tapi
  menambah tabel ke-16 di luar PRD.

## D5. Nomor pesanan bulanan tanpa bentrok

- **Konteks:** `INV-{TAHUN}{BULAN}-{0001}` harus unik walau dua pesanan dibuat
  bersamaan.
- **Opsi A (rekomendasi):** di dalam transaksi buat pesanan, ambil nomor terakhir
  bulan itu, +1; `order_number` UNIQUE, dan jika bentrok (Prisma `P2002`) ulangi
  transaksi maksimal 3 kali.
- **Opsi B:** tabel penghitung per bulan dengan `SELECT … FOR UPDATE`. Lebih
  pasti, tapi menambah tabel di luar PRD.

## D6. Email saat development

- **Konteks:** tim tidak punya SMTP bersama saat development.
- **Rekomendasi:** jika `SMTP_HOST` kosong dan `NODE_ENV !== 'production'`,
  `lib/email` mencetak isi email ke konsol alih-alih mengirim. Opsional: Mailpit
  di `localhost:1025` untuk melihat tampilan email.

## D7. Cara memanggil job terjadwal

- **Konteks:** PRD §10.6 menyebut `GET /api/cron/orders` dijaga `CRON_SECRET`,
  tapi tidak menyebut cara mengirimnya. Windows tidak punya crontab.
- **Rekomendasi:** header `Authorization: Bearer <CRON_SECRET>` (bukan query
  string, agar tidak tercatat di log Nginx). Saat development dipanggil manual:
  `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/orders`.

## D8. Library JWT dan bcrypt

- **Konteks:** PRD menyebut "bcrypt + session JWT". `proxy.ts` berjalan di
  runtime yang tidak selalu mendukung modul native Node.
- **Rekomendasi:** `jose` untuk JWT (jalan di proxy dan server), `bcryptjs` untuk
  hash password (algoritma bcrypt, tanpa kompilasi native yang sering gagal di
  Windows).

## D9. Payment gateway Midtrans — *menyimpang dari PRD §21*

- **Konteks:** PRD §21 dan slide 19 menaruh payment gateway di luar cakupan
  (Midtrans/Xendit mensyaratkan PT/CV). Pada 27 September 2026 diputuskan
  membangun integrasi **Midtrans Snap mode sandbox** lebih dulu: modul
  `src/lib/payment/`, panduan `runbooks/payment-midtrans.md`.
- **Yang sudah pasti:** sandbox, tanpa SDK (fetch), status dikonfirmasi lewat
  API Status, konfirmasi/batal tetap lewat `ubahStatus()`. COD dan konfirmasi
  manual admin tetap ada.
- **Masih terbuka:**
  1. Menambah 4 kolom di `orders` (`payment_attempt`, `payment_transaction_id`,
     `payment_url`, `payment_type`) — di luar skema PRD §9. Rekomendasi: setuju.
  2. Route handler ketiga `POST /api/payment/midtrans` (aturan keras CLAUDE.md
     #5 hanya mengizinkan dua). Rekomendasi: setuju; webhook memang tidak bisa
     lewat Server Action.
  3. Apakah tombol "Bayar Sekarang (simulasi)" PRD §7.7 tetap ada untuk demo
     tanpa internet. Rekomendasi: tetap ada, hanya di `NODE_ENV !== 'production'`.
  4. Production: akun Midtrans atas nama badan usaha. Tanpa itu rilis tetap
     memakai konfirmasi manual admin.
- **Perlu disetujui:** ketua tim (A1) dan pembimbing magang, karena mengubah
  cakupan PRD.

---

## Sudah diputuskan

| Tanggal | Keputusan | Sumber |
|---|---|---|
| 27 Sep 2026 | **D10 — tetap GitHub Free, repo private.** Proteksi branch/ruleset tidak tersedia untuk kombinasi ini (HTTP 403 dari GitHub). Aturan 2 persetujuan dijaga disiplin tim (hanya A1 yang merge) dan penjaga gratis: hook `pre-push` (aktif), CI Actions dan workflow pendeteksi pelanggaran (disiapkan, belum aktif karena Actions tampaknya dimatikan di organisasi). Opsi yang ditolak: upgrade ke GitHub Team (berbayar), repo public (PRD terbuka). Default branch `develop` masih menunggu admin `azridalimunthe7`. | Pemilik proyek, `CONTRIBUTING.md` bagian 3 |
| 27 Sep 2026 | Test runner unit: **Vitest** (`vitest.config.ts`, test di `src/**/*.test.ts`); E2E tetap Playwright | Dipakai pertama kali oleh modul pembayaran (D3 lama) |
| — | Package manager: **npm** | PRD §22 memakai `npm run db:reset` |
| — | Alur Git: branch fitur → `develop` → `main`, PR 2 reviewer | Presentasi slide 15 |
| — | Tanpa payment gateway; pembayaran simulasi/konfirmasi manual | PRD §21, slide 19 |
