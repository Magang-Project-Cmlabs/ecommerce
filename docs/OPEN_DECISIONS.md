# Keputusan Terbuka — TokoKita

Hal yang tidak dijawab PRD atau perlu dipastikan sebelum dikerjakan. Setiap
butir punya rekomendasi; yang memutuskan adalah ketua tim (`azridalimunthe7`) bersama A1 (`kvnlhm`) kecuali disebut
lain. Setelah diputuskan, pindahkan ke bagian **Sudah diputuskan** beserta
tanggalnya.

Terakhir diperbarui: **1 Oktober 2026**

---



## D6. Email saat development

> **Diterapkan 27 Sep 2026** — `src/lib/email/` (mode `konsol` bila
> `SMTP_HOST` kosong di luar production; production tanpa SMTP tidak pernah
> mencetak isi email).

- **Konteks:** tim tidak punya SMTP bersama saat development.
- **Rekomendasi:** jika `SMTP_HOST` kosong dan `NODE_ENV !== 'production'`,
  `lib/email` mencetak isi email ke konsol alih-alih mengirim. Opsional: Mailpit
  di `localhost:1025` untuk melihat tampilan email.


## D8. Library JWT dan bcrypt

- **Konteks:** PRD menyebut "bcrypt + session JWT". `proxy.ts` berjalan di
  runtime yang tidak selalu mendukung modul native Node.
- **Rekomendasi:** `jose` untuk JWT (jalan di proxy dan server), `bcryptjs` untuk
  hash password (algoritma bcrypt, tanpa kompilasi native yang sering gagal di
  Windows).


## D12. Rate limit hanya per IP

- **Konteks (review keamanan PR #14):** PRD §13 membatasi per IP. Penyerang yang
  bisa mengganti IP (botnet, atau header palsu bila app terbuka tanpa Nginx)
  tetap bisa mencoba banyak password / memetakan email lewat `/daftar`.
- **Sudah ada:** jeda 1 menit per akun untuk email reset; bcrypt memperlambat
  tebakan; salah konfigurasi header tidak lagi mengunci semua pengunjung
  (kebijakan lama; production sekarang gagal aman dan mempercayai header Vercel, D4).
- **Opsi A (rekomendasi, sebelum rilis):** tambah batas per email untuk
  `/masuk` (mis. 10 gagal / 15 menit) — hati-hati: bisa dipakai mengunci akun
  orang lain, jadi batasnya lebih longgar dari batas IP.
- **Opsi B:** captcha setelah N gagal — butuh layanan pihak ketiga, di luar PRD §5.
- Token reset di query string: halaman memakai referrer no-referrer; hindari log query pada observabilitas
  (`runbooks/deployment.md` §4).


## D9. Payment gateway Midtrans

- **Konteks awal:** PRD §21/slide 19 menempatkan payment gateway di luar cakupan.
  Pemilik sebelumnya memilih sandbox; pada 1 Oktober 2026 pemilik meminta
  seluruh aplikasi diselesaikan tanpa menunggu bagian anggota lain.
- **Implementasi:** Server Actions pembayaran pemilik pesanan dan webhook
  `POST /api/payment/midtrans` aktif. Signature, jumlah, status API dan
  percobaan pembayaran aktif diperiksa; transisi tetap lewat `ubahStatus()`.
- **Demo:** simulasi hanya jika `PAYMENT_SIMULATION_ENABLED=true` di luar
  production. COD dan konfirmasi manual admin tetap tersedia.
- **Sisa eksternal:** akun/kunci merchant production dan uji pembayaran pada
  domain resmi belum tersedia. Sandbox bukan transaksi uang sungguhan.

---

## Sudah diputuskan

| Tanggal | Keputusan | Sumber |
|---|---|---|
| 1 Okt 2026 | **D14 — Vercel + Aiven menjadi target rilis**, menggantikan VPS. PRD §16 dan runbook direvisi. State rate limit memakai MySQL, unggahan S3/R2 satu file per request; cron 15 menit memerlukan Pro atau penjadwal eksternal. | Instruksi langsung pemilik proyek |
| 1 Okt 2026 | **D4 — rate limit MySQL bersama pada production/Vercel.** Tambahan tabel infrastruktur `auth_rate_limits` (tabel 16), HMAC IP, transaksi atomik 5 percobaan/15 menit untuk masuk, daftar, lupa dan reset password; Map hanya lokal. Missing trusted IP/DB gagal aman. | Target serverless pemilik; 8 integrasi MySQL |
| 1 Okt 2026 | **D11 — JWT terikat versi password.** Claim `pv` berupa HMAC dari bcrypt hash, dibandingkan constant time dengan versi hash sekarang. Reset/ganti password mencabut sesi lama tanpa kolom sesi tambahan; token lama tanpa `pv` perlu login ulang. | Implementasi dan 4 integrasi MySQL auth |
| 1 Okt 2026 | **D5 — nomor bulanan UNIQUE dan retry transaksi** saat bentrok; tidak menambah tabel penghitung. | Implementasi checkout dan tes transaksi bersamaan |
| 1 Okt 2026 | **D7 — Bearer CRON_SECRET**, tanpa secret pada URL. Endpoint idempoten; workflow Actions alternatif Hobby sudah tersedia, aktivasi menunggu environment target. | Implementasi dan tes cron |
| 1 Okt 2026 | **D15 — Data Cache untuk kategori, banner dan pilihan beranda publik 60 detik.** Namespace database terpisah, admin/ulasan invalidasi tag; harga/stok/promo transaksi, akun, sesi dan eligibility tidak di-cache. API kompatibilitas `unstable_cache` tetap digunakan selama layout autentikasi ini belum memakai Cache Components; panduan Next.js 16 dibaca. | Pengukuran Aiven: query beranda hangat turun menjadi 48 ms |
| 1 Okt 2026 | **Dependensi keamanan:** tetap Next.js 16.3.6/Prisma 7.10.0; override mariadb 3.5.4, mysql2 3.24.5, deepmerge-ts 8.0.2 dan Vitest 5.0.3. Audit 0 kerentanan, tes aktual membuktikan kompatibilitas. | npm audit + advisory resmi + verifikasi |
| 30 Sep 2026 | **D13 — Kontrak checkout & pesanan berlaku** ([`KONTRAK_CHECKOUT.md`](KONTRAK_CHECKOUT.md)). Hal yang tidak diatur PRD §7.6/§10: `quantity` per baris 1–99 (stok tetap dicek terpisah) · maksimal 50 baris per pesanan · `notes` maksimal 500 karakter · alamat baru lewat action alamat terpisah (dipakai ulang buku alamat `/akun`), checkout hanya menerima `addressId` · halaman sukses `/checkout/berhasil/[nomor]` dijaga `requireUser` + kepemilikan. Perubahan hanya lewat PR yang mengubah kontrak. | Pemilik proyek, PR #19 (pertanyaan A4) |
| 27 Sep 2026 | **Pesan pendaftaran "Email sudah terdaftar" diterima sebagai risiko sadar.** Mengonfirmasi keberadaan akun (enumerasi), tetapi PRD §13 hanya mensyaratkan anti-enumerasi untuk masuk & lupa password, dan pembeli perlu tahu agar memakai Masuk alih-alih membuat akun ganda. Mitigasi: rate limit `/daftar` (D4). Masuk tetap memakai pesan & waktu yang seragam. | Review keamanan PR #10 |
| 27 Sep 2026 | **Otorisasi selalu lewat `ambilPenggunaSaatIni()`**, bukan `ambilSesi()` mentah: JWT stateless tetap sah sampai kedaluwarsa (30 hari) walau pengguna keluar atau akun dihapus; hanya `ambilPenggunaSaatIni()` yang memastikan akun masih ada (`deleted_at IS NULL`). Konteks awal pencabutan sesi diperbarui oleh D11: perubahan password langsung mencabut token lama tanpa tabel sesi tambahan. | Review keamanan PR #10 |
| 27 Sep 2026 | **D1 — Next.js 16.3.6** (sesuai `proxy.ts` di PRD), dikunci persis. | Scaffold, `runbooks/local-setup.md` |
| 27 Sep 2026 | **D2 — Prisma 7.10.0** (`prisma`, `@prisma/client`, `@prisma/adapter-mariadb` sama persis), konfigurasi di `prisma7.config.ts`, client di `src/generated/prisma/`. Tag `latest` CLI menunjuk RC 8.0 sehingga tidak dipakai. | Scaffold, dokumentasi resmi Prisma MySQL |
| 27 Sep 2026 | **Skema database:** metode bayar & kurir disimpan sebagai **enum** (`PaymentMethod`, `ShippingMethod`, kode dari GLOSSARY); `users.phone` **boleh kosong** (form daftar tidak mewajibkan, dikosongkan saat anonimisasi). | Pemilik proyek, migration `20260927072940_init` |
| 27 Sep 2026 | **D10 — tetap GitHub Free, repo private.** Proteksi branch/ruleset tidak tersedia untuk kombinasi ini (HTTP 403 dari GitHub). Aturan 2 persetujuan dijaga disiplin tim (hanya A1 yang merge) dan penjaga gratis: hook `pre-push` (aktif), CI Actions dan workflow pendeteksi pelanggaran (aktif sejak 27 Sep 2026; hasilnya terlihat di PR tetapi tidak bisa memblokir merge, jadi penggabung wajib mengecek ✓ sebelum merge). Opsi yang ditolak: upgrade ke GitHub Team (berbayar), repo public (PRD terbuka). Pengecualian: pemilik proyek (`kvnlhm`) boleh merge tanpa persetujuan anggota lain. Default branch `develop` masih menunggu admin `azridalimunthe7`. | Pemilik proyek, `CONTRIBUTING.md` bagian 3 |
| 27 Sep 2026 | Test runner unit: **Vitest** (`vitest.config.mts`, test di `src/**/*.test.ts`); E2E tetap Playwright | Dipakai pertama kali oleh modul pembayaran (D3 lama) |
| — | Package manager: **npm** | PRD §22 memakai `npm run db:reset` |
| — | Alur Git: branch fitur → `develop` → `main`, PR 2 reviewer | Presentasi slide 15 |
| — | Baseline awal tanpa gateway; diperbarui D9 dengan integrasi sandbox, produksi menunggu akun merchant | PRD §21, slide 19 |
