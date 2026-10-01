# Status Proyek — TokoKita

**Repo:** `Magang-Project-Cmlabs/ecommerce` (private)
**Branch integrasi:** `feat/penyelesaian-tokokita`
**Diperbarui:** 1 Oktober 2026

## 1. Ringkasan

Katalog, keranjang, checkout, akun, pesanan, wishlist, ulasan dan panel admin
sudah memakai MySQL nyata. UI mengacu pada PPT dan PRD kanonik. Branch
menggabungkan `develop` (`1fb10162`) dan pekerjaan anggota pada `feature`
(`2d01e28`); kepemilikan kartu anggota tetap berlaku.

Target pemilik berubah menjadi **Vercel + Aiven**. TLS dan tiga migration
Aiven sudah diverifikasi tanpa reset. Preview melalui integrasi Git Vercel
sudah dicoba tetapi deployment FAIL; toko online belum dinyatakan 100% siap.

## 2. Kemajuan per tahap

| Tahap | Keadaan |
|---|---|
| Fondasi | Layout, auth, guard, reset, versi password dan limiter MySQL bersama selesai |
| Katalog | Beranda, kategori, saran/pencarian, filter, sort, pagination, grid/list dan detail selesai |
| Keranjang & Checkout | Empat langkah, alamat, ongkir, promo, stok atomik, invoice, Snap sandbox dan COD selesai |
| Akun & Admin | Profil/password/alamat/anonimisasi, riwayat/timeline, CRUD admin, stok, arsip dan pemrosesan pesanan selesai |
| Pelengkap | Wishlist, ulasan terverifikasi, unggahan bertoken, promo/banner, metadata, sitemap dan bantuan selesai |
| Rilis | Tes fungsi lokal lulus; performa dan konfigurasi layanan cloud masih perlu ditutup |

## 3. Verifikasi sesi 1 Oktober 2026

| Pemeriksaan | Status | Bukti / batas |
|---|---|---|
| `npm run typecheck` | PASS | Next typegen dan TypeScript |
| `npm run lint` | PASS | Tanpa error/warning ESLint |
| `npm run test` | PASS | 392 lulus; dua tes jaringan sandbox berjalan lewat skrip khusus |
| `npm run test:integration` | PASS | 28 tes MySQL nyata: transaksi/race/stok/promo, admin, auth, preorder, SMTP dan limiter |
| `npx prisma validate` | PASS | 15 tabel bisnis + tabel infrastruktur limiter, tiga migration |
| `npm run build` | PASS | Build production, 31 route |
| `npm run e2e` | PASS | 83/83 tanpa skip: lifecycle pembeli/admin, IDOR, auth, axe dan mobile 360 px |
| Admin production + axe | PASS | Login nyata ke build production dengan Aiven; nol pelanggaran serius/kritis. Sidebar gelap/biru mengikuti PPT, empat admin E2E ulang PASS |
| Batas unggahan serverless | PASS | Delapan foto produk dan tiga foto ulasan hampir 2 MB/file; request satu file lalu token kecil |
| `npm audit --omit=dev` | PASS | Nol kerentanan; audit penuh saat install juga nol |
| TLS + migration Aiven | PASS | Verifikasi CA aktif, data lama dipertahankan |
| Seed DB verifikasi terpisah | PASS | 14 pengguna, 26 produk, 79 pesanan, 188 ulasan; toko tidak di-reset |
| Pembuatan Snap sandbox nyata | PASS | Sesi baru Rp 324.300 dibuat 1 Okt |
| Settlement sandbox sesi baru | NOT_RUN | Memerlukan simulator; settlement 27 Sep adalah bukti historis |
| SMTP eksternal | NOT_RUN | Dua tes SMTP loopback lulus; kredensial production belum tersedia |
| Bucket S3/R2 nyata | NOT_RUN | Validasi gambar/token/SigV4 diuji; kredensial bucket belum tersedia |
| Preview Vercel terbaru | FAIL | Integrasi Git repo pribadi, commit 1acd7c2; deployment dpl_9g2dyzipY6uL8Q46t1iAhoH1yXxD gagal. Penyebab belum diketahui: CLI belum login untuk membaca log |
| Rilis production terbaru | NOT_RUN | Belum dipromosikan; production lama masih versi fondasi |
| Cron pada domain resmi | NOT_RUN | Endpoint diuji; penjadwal/environment target belum diaktifkan |
| Backup/restore manual Aiven | PASS | Dump TLS 155.148 bytes, restore DB terpisah: 26 produk/14 pengguna/79 pesanan/188 ulasan/3 migration |
| Lighthouse DevTools mobile, 4G + CPU 4x | PASS | Beranda 93/LCP 2,344 s; katalog 93/2,351 s; detail 96/2,246 s; CLS <0,001. Build production dengan Aiven, cache hangat |
| Lighthouse simulasi bawaan | FAIL | Beranda 80, katalog 85, detail 85; LCP sekitar 4,3–4,4 s. Hasil kedua metode dipertahankan; domain Vercel belum diuji |
| CI implementasi dan dokumentasi | PASS | [Run 36839552818](https://github.com/Magang-Project-Cmlabs/ecommerce/actions/runs/36839552818), commit 8d8696a: verifikasi dan transaksi_mysql lulus; build memakai fixture APP_URL HTTPS |

## 4. Kriteria sukses PRD §22

| Kriteria | Status | Bukti / batas |
|---|---|---|
| Data di MySQL | PASS | E2E dan integrasi tanpa pesanan sukses palsu |
| Pencarian/filter/sort/grid/list/pagination | PASS | Tes katalog/navigasi |
| Detail/galeri/varian/ulasan | PASS | Katalog, commerce dan unggahan ulasan |
| Keranjang/jumlah/promo | PASS | Harga dihitung ulang server; unit dan E2E |
| Auth/reset/guard | PASS | Unit, integrasi dan E2E |
| Checkout/ongkir/tanpa overselling | PASS | Transaksi berebut stok terakhir; E2E empat langkah |
| Pembatalan otomatis/stok/promo kembali | PASS | MySQL/idempotensi; jadwal online NOT_RUN |
| Admin produk/stok/pesanan | PASS | Integrasi dan E2E lifecycle |
| Email perubahan status | NOT_RUN | Loopback membuktikan pengiriman setelah commit; belum SMTP eksternal |
| Riwayat/detail/timeline | PASS | E2E pembeli/admin |
| Performa/SEO/aksesibilitas | FAIL | Metadata/axe lulus; target Lighthouse/LCP belum seluruhnya terbukti |
| Reset/seed demo lengkap | PASS | Migration dan seed DB verifikasi baru; tanpa reset toko |
| Responsif | PASS | Mobile 360 px/desktop dan QA mengacu PPT |

## 5. Sisa rilis

Login Vercel, tautkan proyek yang benar, isi environment, SMTP, S3/R2 dan
penjadwal sesuai [runbook deployment](runbooks/deployment.md).
Uji HTTPS resmi, email, upload, pembayaran, performa dan restore setelah
deploy. Detail lanjutan: [SERAH_TERIMA](SERAH_TERIMA.md).
