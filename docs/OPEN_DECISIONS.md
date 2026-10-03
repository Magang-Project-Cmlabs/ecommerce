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

- **Konteks awal:** PRD §21/slide 19 (PPT versi awal) menempatkan payment gateway di luar cakupan.
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
| 3 Okt 2026 | **D21 — Login Google (PRD §21 "Di Luar Cakupan", dibuka pemilik).** OAuth 2.0 Authorization Code + PKCE (S256), `state` dan `nonce` di cookie httpOnly 10 menit (path `/api/auth/google`). ID token diverifikasi dengan kunci publik Google (`jose`, sudah terpasang; tanpa pustaka auth baru): penerbit, audiens, kedaluwarsa, nonce, `email_verified`. Akun dicari lewat `users.google_sub` (kolom baru, migration `20261003150000_login_google`), lalu email terverifikasi (ditautkan; **password lama diganti hash acak di update yang sama** untuk mencegah pra-pembajakan akun yang didaftarkan orang lain dengan email korban), atau dibuat akun pembeli dengan password acak (bisa diatur lewat Lupa password). **Admin tidak bisa masuk lewat Google**; akun dihapus ditolak; email yang tertaut akun Google lain ditolak; hapus akun mengosongkan `google_sub`. **Pengecualian aturan 5 CLAUDE.md:** dua route handler GET `/api/auth/google` dan `/api/auth/google/callback` (callback OAuth wajib GET). Callback dibatasi 20/15 menit per IP. Nonaktif tanpa `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`. | Permintaan pemilik 3 Okt 2026; [runbook](runbooks/login-google-dan-lacak-resi.md) |
| 3 Okt 2026 | **D20 — Lacak resi otomatis lewat API Binderbyte (PRD §21 "Di Luar Cakupan", dibuka pemilik).** `GET https://api.binderbyte.com/v1/track` (JNE, SiCepat; GoSend tidak didukung). Dijalankan hanya saat tombol "Lacak paket" ditekan oleh pemilik pesanan atau admin, untuk pesanan Dikirim/Selesai; hasil disimpan 30 menit per kurir+resi; batas 20 lacak/10 menit per pengguna; kunci API hanya di server. Biteship ditolak karena pelacakan publiknya berbayar Rp 10/hit bahkan di mode uji. Nonaktif tanpa `LACAK_RESI_API_KEY`. | Permintaan pemilik 3 Okt 2026 |
| 3 Okt 2026 | **D19 — Ongkir per zona provinsi tujuan (PRD §10.3/§21 diperluas).** Tabel tarif buatan toko (bukan API ekspedisi) di `src/lib/pesanan/ongkir.ts`: zona Jawa memakai tarif lama (JNE Rp 15.000, SiCepat Rp 13.000 per kg), zona Sumatra, Bali & Nusa Tenggara, Kalimantan, Sulawesi, Maluku & Papua lebih mahal dengan estimasi lebih lama. Provinsi dipilih dari daftar 38 provinsi (`src/lib/pesanan/wilayah.ts`), disimpan dengan nama baku; penulisan lama/singkatan dikenali; provinsi tak dikenal menonaktifkan kurir reguler (tidak menebak tarif). GoSend tetap hanya sekota toko, kini mengenali "Jakarta Selatan" dsb. | Permintaan pemilik 3 Okt 2026 |
| 3 Okt 2026 | **D18 — Asisten AI publik ("Tanya AI").** Tombol melayang di halaman toko (bukan admin/checkout) membuka panel chat; jawaban dari model lewat `fetch` ke endpoint Chat Completions kompatibel OpenAI (tanpa SDK). Bawaan **Google Gemini API** (`gemini-flash-lite-latest`, cadangan `gemini-flash-latest`), kunci gratis tanpa kartu dari Google AI Studio di `ASISTEN_API_KEY`; Penyedia cadangan (3 Okt): `ASISTEN_CADANGAN_API_KEY` dengan bawaan **Groq** (`openai/gpt-oss-120b`, lalu `qwen/qwen3.8-27b`; kunci gratis tanpa kartu; model yang hilang otomatis dilewati); urutan Gemini Flash-Lite → Gemini Flash → Groq, kunci yang ditolak langsung pindah penyedia, maksimal 4 panggilan dan 30 detik per pertanyaan. Penyedia lain yang kompatibel (mis. OpenRouter) lewat `*_BASE_URL` + `*_MODEL`; OpenRouter tidak dipilih sebagai cadangan karena jatah model gratisnya sekitar 50 permintaan/hari tanpa saldo. Jalur Server Action `tanyaAsisten` (bukan route handler baru, aturan 5); publik tanpa login karena hanya memakai data toko publik (FAQ, ongkir, metode bayar, status, katalog tanpa stok persis, judul banner). Tidak pernah memuat data akun, pesanan, kode promo non-publik, atau konfigurasi. Pesan berisi nomor kartu/NIK/password/OTP/kunci ditolak dan disamarkan sebelum dikirim. Pengaman (3 Okt): (1) instruksi topik ketat — bukan chatbot serba bisa, daftar topik ditolak (kode/SQL, PR, esai/puisi, terjemahan, pengetahuan umum, saran medis/hukum/keuangan, roleplay) dengan kalimat penolakan tetap, data toko ditandai "bukan instruksi", pengingat aturan diulang di akhir; uji langsung 16/16 pada Gemini dan Groq; (2) model tanpa `tools`/akses database/internet, hanya teks (dikunci test), data dari query Prisma tetap; (3) pembatas berlapis di tabel `auth_rate_limits`: 20/10 menit dan 100/hari per pengguna login (`u:<id>`) atau per IP (`ip:<ip>`), plus 1.500/hari global; (4) riwayat dari browser dibatasi 12 pesan dan 6.000 karakter total, pertanyaan 600 karakter, jawaban 800 token; (5) cache jawaban pertanyaan pembuka yang sama 1 jam (tag `katalog-publik`); (6) tombol darurat `ASISTEN_NONAKTIF=1` menyembunyikan tombol dan menolak semua permintaan; (7) CSRF ditangani pemeriksaan Origin bawaan Server Action Next.js. Tanpa kunci, tombol tidak tampil di produksi. Ditolak: Vercel AI Gateway (wajib kartu kredit walau memakai kredit gratis, HTTP 403 saat diuji 3 Okt) dan Pollinations tanpa kunci (HTTP 500/401). Catatan privasi: paket gratis Gemini boleh dipakai Google untuk perbaikan produk, karena itu pengguna diingatkan tidak membagikan data pribadi. | Permintaan pemilik |
| 3 Okt 2026 | **D17 — Password memakai Argon2id, menggantikan bcrypt (PRD §4, §13, D8).** Paket `@node-rs/argon2` (biner siap pakai, tanpa node-gyp, termasuk daftar paket eksternal bawaan Next.js), parameter OWASP m=19 MiB, t=2, p=1. Hash bcrypt lama tetap dikenali lewat `bcryptjs` dan diganti Argon2id diam-diam saat login berhasil (update bersyarat pada hash lama); bila penggantian gagal, login tetap jalan. Akibatnya sesi lain milik akun lama ikut berakhir sekali (versi password `pv` berubah). Batas panjang password naik dari 72 menjadi 128 byte. Seed memakai Argon2id. | Permintaan pemilik |
| 3 Okt 2026 | **D16 — Arah visual monokrom bergaya template Framer, mode terang + gelap.** Menggantikan palet PRD §17 (primary `orange-500`, harga `text-orange-600`, secondary `blue-600`): aksi utama hitam (terang) / putih (gelap), merah `--sale` hanya untuk label diskon dan hati wishlist, tanpa biru. Judul memakai Albert Sans (Google Fonts lewat `next/font`, bukan library baru), isi tetap Inter. Mode gelap memakai kelas `dark` pada `<html>` + skrip kecil di `<head>`, pilihan disimpan di `localStorage('tema')`; `next-themes` yang sudah terpasang tidak dipakai. Rincian di `DESIGN.md`. | Instruksi pemilik: "tema warna terserah, tidak harus oranye", acuan Framer ecom/sabina/sneako/horven/furnexa |
| 1 Okt 2026 | **D15 — Unggahan gambar produksi memakai Vercel Blob (store publik `tokokita-gambar`, wilayah sin1)** sebagai alternatif S3/R2 yang butuh kartu. Tanpa library baru: `PUT https://vercel.com/api/blob/?pathname=uploads/<uuid>.webp` dengan `BLOB_READ_WRITE_TOKEN` (dipasang Vercel). Aktif lewat `STORAGE_DRIVER=blob`; driver `s3` tetap didukung. `upload-token` hanya menerima `https://<id>.public.blob.vercel-storage.com/uploads/<uuid>.webp`. Batas paket Hobby berlaku (cek kuota Blob di dasbor Vercel). | Permintaan pemilik; `src/lib/storage.ts` |
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
| — | Alur Git: branch fitur → `develop` → `main`, PR 2 reviewer | Presentasi slide 17 |
| — | Baseline awal tanpa gateway; diperbarui D9 dengan integrasi sandbox, produksi menunggu akun merchant | PRD §21, slide 19 PPT versi awal |
