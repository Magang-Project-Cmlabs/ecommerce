# Keputusan Terbuka — TokoKita

Hal yang tidak dijawab PRD atau perlu dipastikan sebelum dikerjakan. Setiap
butir punya rekomendasi; yang memutuskan adalah ketua tim (`azridalimunthe7`) bersama A1 (`kvnlhm`) kecuali disebut
lain. Setelah diputuskan, pindahkan ke bagian **Sudah diputuskan** beserta
tanggalnya.

Terakhir diperbarui: **30 September 2026**

---

## D4. Tempat menyimpan hitungan rate limit login

> **Diterapkan 27 Sep 2026 (opsi A, kartu *Fitur lupa password*)** —
> `src/lib/auth/batas-percobaan.ts`, berlaku untuk masuk, daftar, dan lupa
> password. Menunggu konfirmasi ketua tim; mudah diganti ke opsi B karena
> hanya dipanggil dari `src/actions/auth.ts`.

- **Konteks:** PRD §13 membatasi 5 percobaan/15 menit per IP untuk login dan lupa
  password, tapi skema PRD §9 tidak punya tabel untuk itu.
- **Opsi A (rekomendasi):** `Map` di memori server. Sederhana; syaratnya PM2
  berjalan **satu instance** (mode fork). Hitungan hilang saat restart — dapat
  diterima.
- **Opsi B:** tabel `login_attempts`. Tahan restart dan multi-instance, tapi
  menambah tabel ke-16 di luar PRD.
- **Cakupan (dari review keamanan PR #10):** batasi juga `/daftar`, bukan hanya
  masuk dan lupa password. Setiap percobaan daftar menjalankan bcrypt dan
  pesannya mengonfirmasi email terdaftar, sehingga tanpa batas bisa dipakai
  memetakan akun secara massal dan membebani CPU.

## D5. Nomor pesanan bulanan tanpa bentrok

- **Konteks:** `INV-{TAHUN}{BULAN}-{0001}` harus unik walau dua pesanan dibuat
  bersamaan.
- **Opsi A (rekomendasi):** di dalam transaksi buat pesanan, ambil nomor terakhir
  bulan itu, +1; `order_number` UNIQUE, dan jika bentrok (Prisma `P2002`) ulangi
  transaksi maksimal 3 kali.
- **Opsi B:** tabel penghitung per bulan dengan `SELECT … FOR UPDATE`. Lebih
  pasti, tapi menambah tabel di luar PRD.

## D6. Email saat development

> **Diterapkan 27 Sep 2026** — `src/lib/email/` (mode `konsol` bila
> `SMTP_HOST` kosong di luar production; production tanpa SMTP tidak pernah
> mencetak isi email).

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

## D11. Sesi lama tetap hidup setelah reset password

- **Konteks:** sesi berupa JWT stateless 30 hari. Setelah password direset,
  sesi di perangkat lain (mis. milik orang yang mencuri akun) tetap sah sampai
  kedaluwarsa. Reset hanya membuang sesi di browser yang dipakai mereset.
- **Opsi A (rekomendasi):** kolom `users.password_changed_at` (migration baru,
  di luar skema PRD §9); `ambilPenggunaSaatIni()` menolak token dengan `iat`
  lebih lama dari kolom itu. Murah, sekaligus bisa dipakai kartu *Ganti
  password* (A5).
- **Opsi B:** tabel sesi — memungkinkan "keluar dari semua perangkat", tetapi
  lebih besar.
- **Sementara:** diterima sebagai risiko sadar; dicatat di review keamanan.

## D12. Rate limit hanya per IP

- **Konteks (review keamanan PR #14):** PRD §13 membatasi per IP. Penyerang yang
  bisa mengganti IP (botnet, atau header palsu bila app terbuka tanpa Nginx)
  tetap bisa mencoba banyak password / memetakan email lewat `/daftar`.
- **Sudah ada:** jeda 1 menit per akun untuk email reset; bcrypt memperlambat
  tebakan; salah konfigurasi header tidak lagi mengunci semua pengunjung
  (rate limit nonaktif + peringatan di log).
- **Opsi A (rekomendasi, sebelum rilis):** tambah batas per email untuk
  `/masuk` (mis. 10 gagal / 15 menit) — hati-hati: bisa dipakai mengunci akun
  orang lain, jadi batasnya lebih longgar dari batas IP.
- **Opsi B:** captcha setelah N gagal — butuh layanan pihak ketiga, di luar PRD §5.
- Token reset di query string: mitigasinya log Nginx tanpa query
  (`runbooks/deployment.md` §4).

## D14. Deploy demo di Vercel + Aiven — *menyimpang dari PRD §16*

- **Konteks:** PRD §16 menargetkan VPS (PM2 + Nginx + MySQL 8). Untuk demo
  cepat, A1 men-deploy salinan repo (`kvnlhm/ecommerce`, private) ke Vercel
  dengan MySQL terkelola Aiven. Repo organisasi tidak berubah.
- **Sudah ada:** koneksi TLS terverifikasi lewat `DATABASE_CA_CERT`
  (`src/lib/konfigurasi-db.ts`); langkah di `runbooks/deployment.md` §8.
- **Yang belum cocok dengan serverless:** rate limit di memori (D4) tidak
  efektif karena tiap instance punya hitungan sendiri · `STORAGE_DRIVER=local`
  tidak bisa dipakai (filesystem hanya-baca) · job cron perlu penjadwal Vercel
  atau eksternal (D7).
- **Opsi A (rekomendasi):** Vercel + Aiven hanya untuk demo/pratinjau; rilis
  akhir tetap VPS sesuai PRD.
- **Opsi B:** Vercel jadi target rilis — butuh revisi PRD §16 dan penyelesaian
  tiga butir di atas.

## D9. Payment gateway Midtrans — *menyimpang dari PRD §21*

- **Konteks:** PRD §21 dan slide 19 menaruh payment gateway di luar cakupan
  (Midtrans/Xendit mensyaratkan PT/CV). Pada 27 September 2026 diputuskan
  membangun integrasi **Midtrans Snap mode sandbox** lebih dulu: modul
  `src/lib/payment/`, panduan `runbooks/payment-midtrans.md`.
- **Yang sudah pasti:** sandbox, tanpa SDK (fetch), status dikonfirmasi lewat
  API Status, konfirmasi/batal tetap lewat `ubahStatus()`. COD dan konfirmasi
  manual admin tetap ada.
- **Masih terbuka:**
  1. ~~Menambah 4 kolom di `orders`~~ — **diputuskan 27 Sep 2026 oleh pemilik
     proyek:** `payment_attempt`, `payment_transaction_id`, `payment_url`,
     `payment_type` masuk migration pertama (`20260927072940_init`).
  2. Route handler ketiga `POST /api/payment/midtrans` (aturan keras CLAUDE.md
     #5 hanya mengizinkan dua). Rekomendasi: setuju; webhook memang tidak bisa
     lewat Server Action.
  3. Apakah tombol "Bayar Sekarang (simulasi)" PRD §7.7 tetap ada untuk demo
     tanpa internet. Rekomendasi: tetap ada, hanya di `NODE_ENV !== 'production'`.
  4. Production: akun Midtrans atas nama badan usaha. Tanpa itu rilis tetap
     memakai konfirmasi manual admin.
- **Perlu disetujui:** ketua tim (`azridalimunthe7`) dan pembimbing magang, karena mengubah
  cakupan PRD.

---

## Sudah diputuskan

| Tanggal | Keputusan | Sumber |
|---|---|---|
| 30 Sep 2026 | **D13 — Kontrak checkout & pesanan berlaku** ([`KONTRAK_CHECKOUT.md`](KONTRAK_CHECKOUT.md)). Hal yang tidak diatur PRD §7.6/§10: `quantity` per baris 1–99 (stok tetap dicek terpisah) · maksimal 50 baris per pesanan · `notes` maksimal 500 karakter · alamat baru lewat action alamat terpisah (dipakai ulang buku alamat `/akun`), checkout hanya menerima `addressId` · halaman sukses `/checkout/berhasil/[nomor]` dijaga `requireUser` + kepemilikan. Perubahan hanya lewat PR yang mengubah kontrak. | Pemilik proyek, PR #19 (pertanyaan A4) |
| 27 Sep 2026 | **Pesan pendaftaran "Email sudah terdaftar" diterima sebagai risiko sadar.** Mengonfirmasi keberadaan akun (enumerasi), tetapi PRD §13 hanya mensyaratkan anti-enumerasi untuk masuk & lupa password, dan pembeli perlu tahu agar memakai Masuk alih-alih membuat akun ganda. Mitigasi: rate limit `/daftar` (D4). Masuk tetap memakai pesan & waktu yang seragam. | Review keamanan PR #10 |
| 27 Sep 2026 | **Otorisasi selalu lewat `ambilPenggunaSaatIni()`**, bukan `ambilSesi()` mentah: JWT stateless tetap sah sampai kedaluwarsa (30 hari) walau pengguna keluar atau akun dihapus; hanya `ambilPenggunaSaatIni()` yang memastikan akun masih ada (`deleted_at IS NULL`). Pencabutan sesi instan (keluar dari semua perangkat) butuh tabel sesi — belum direncanakan. | Review keamanan PR #10 |
| 27 Sep 2026 | **D1 — Next.js 16.3.6** (sesuai `proxy.ts` di PRD), dikunci persis. | Scaffold, `runbooks/local-setup.md` |
| 27 Sep 2026 | **D2 — Prisma 7.10.0** (`prisma`, `@prisma/client`, `@prisma/adapter-mariadb` sama persis), konfigurasi di `prisma7.config.ts`, client di `src/generated/prisma/`. Tag `latest` CLI menunjuk RC 8.0 sehingga tidak dipakai. | Scaffold, dokumentasi resmi Prisma MySQL |
| 27 Sep 2026 | **Skema database:** metode bayar & kurir disimpan sebagai **enum** (`PaymentMethod`, `ShippingMethod`, kode dari GLOSSARY); `users.phone` **boleh kosong** (form daftar tidak mewajibkan, dikosongkan saat anonimisasi). | Pemilik proyek, migration `20260927072940_init` |
| 27 Sep 2026 | **D10 — tetap GitHub Free, repo private.** Proteksi branch/ruleset tidak tersedia untuk kombinasi ini (HTTP 403 dari GitHub). Aturan 2 persetujuan dijaga disiplin tim (hanya A1 yang merge) dan penjaga gratis: hook `pre-push` (aktif), CI Actions dan workflow pendeteksi pelanggaran (aktif sejak 27 Sep 2026; hasilnya terlihat di PR tetapi tidak bisa memblokir merge, jadi penggabung wajib mengecek ✓ sebelum merge). Opsi yang ditolak: upgrade ke GitHub Team (berbayar), repo public (PRD terbuka). Pengecualian: pemilik proyek (`kvnlhm`) boleh merge tanpa persetujuan anggota lain. Default branch `develop` masih menunggu admin `azridalimunthe7`. | Pemilik proyek, `CONTRIBUTING.md` bagian 3 |
| 27 Sep 2026 | Test runner unit: **Vitest** (`vitest.config.ts`, test di `src/**/*.test.ts`); E2E tetap Playwright | Dipakai pertama kali oleh modul pembayaran (D3 lama) |
| — | Package manager: **npm** | PRD §22 memakai `npm run db:reset` |
| — | Alur Git: branch fitur → `develop` → `main`, PR 2 reviewer | Presentasi slide 15 |
| — | Tanpa payment gateway; pembayaran simulasi/konfirmasi manual | PRD §21, slide 19 |
