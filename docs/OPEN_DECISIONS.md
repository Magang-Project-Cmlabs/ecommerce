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

## D3. Test runner unit — *perlu sebelum kartu A4*

- **Konteks:** PRD tidak menyebut test runner, padahal aturan stok, promo,
  ongkir, dan status pesanan wajib diuji (Trello A4 · Hari 5 menguji dua pembeli
  bersamaan).
- **Opsi A (rekomendasi):** Vitest untuk unit/integrasi di `src/lib/`, Playwright
  untuk E2E (kerangka sudah ada di `tests/e2e/`).
- **Opsi B:** Jest. Lebih lambat disiapkan untuk TypeScript + ESM.

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

---

## Sudah diputuskan

| Tanggal | Keputusan | Sumber |
|---|---|---|
| — | Package manager: **npm** | PRD §22 memakai `npm run db:reset` |
| — | Alur Git: branch fitur → `develop` → `main`, PR 2 reviewer | Presentasi slide 15 |
| — | Tanpa payment gateway; pembayaran simulasi/konfirmasi manual | PRD §21, slide 19 |
