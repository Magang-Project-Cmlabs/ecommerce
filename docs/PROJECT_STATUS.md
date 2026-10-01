# Status Proyek — TokoKita

**Repo:** `Magang-Project-Cmlabs/ecommerce` (private)
**Branch integrasi:** `develop` (PR #23 dan #25 di-merge 1 Okt 2026; lanjutan di `feat/penyelesaian-tokokita`)
**Diperbarui:** 1 Oktober 2026

## 1. Ringkasan

Katalog, keranjang, checkout, akun, pesanan, wishlist, ulasan dan panel admin
sudah memakai MySQL nyata. UI mengacu pada PPT dan PRD kanonik. Branch
menggabungkan `develop` (`1fb10162`) dan pekerjaan anggota pada `feature`
(`2d01e28`); kepemilikan kartu anggota tetap berlaku.

Target pemilik: **Vercel + Aiven**. Produksi publik
https://ecommerce-peach-seven-47.vercel.app berjalan dari `develop` (DB `tokokita`);
Preview memakai DB uji `tokokita_preview`. Midtrans **sandbox**, cron harian dan akun
berkata sandi acak sudah aktif. Belum 100%: unggah gambar online (R2), email (SMTP),
uji bayar online sampai lunas, QRIS sandbox, dan LCP seluler.

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
| `npm run test` | PASS | 409 lulus (tambah arah login admin dan pembagian beranda tanpa duplikat) |
| `npm run test:integration` | PASS | 30 tes MySQL nyata, termasuk race pergantian attempt dan settlement ganda |
| `npx prisma validate` | PASS | 15 tabel bisnis + tabel infrastruktur limiter, tiga migration |
| `npm run build` | PASS | Build production, 31 route |
| `npm run e2e` (subset Chrome/Android) | PASS | Setelah perubahan UI: admin, navigasi, responsif 360 px, axe, auth-guard, katalog, commerce, ulasan (52–56 kasus per putaran) |
| Admin production + axe | PASS | Login nyata ke build production dengan Aiven; nol pelanggaran serius/kritis. Sidebar gelap/biru mengikuti PPT, empat admin E2E ulang PASS |
| Batas unggahan serverless | PASS | Delapan foto produk dan tiga foto ulasan hampir 2 MB/file; request satu file lalu token kecil |
| `npm audit --omit=dev` | PASS | Nol kerentanan; audit penuh saat install juga nol |
| TLS + migration Aiven | PASS | Verifikasi CA aktif, data lama dipertahankan |
| Seed DB verifikasi terpisah | PASS | 14 pengguna, 26 produk, 79 pesanan, 188 ulasan; toko tidak di-reset |
| Pembuatan Snap sandbox nyata | PASS | Sesi baru Rp 324.300 dibuat 1 Okt |
| Settlement sandbox BCA/Mandiri | PASS | Snap dan simulator resmi, API settlement Rp 114.000, tombol Cek Pembayaran menyimpan paid/confirmed di DB; webhook ulang idempoten dan signature salah HTTP 401 |
| Settlement sandbox QRIS | FAIL | QR muncul pada Snap; simulator resmi mengembalikan error 2603 saat memproses QR. Penyelidikan kanal masih berlangsung |
| Firefox/WebKit: regresi akun/katalog/unggahan | PASS | 24/24 setelah memperbaiki input sebelum hydration, refresh wishlist berlebih, fixture ulasan unik dan pengukuran multipart/cookie lintas engine |
| Suite lintas browser penuh (310 kasus: Chrome/Android, Edge, Firefox, WebKit, mobile WebKit) | PASS | Putaran 1 Okt: 299 lulus, 11 gagal karena stok varian M Kaos Polos di DB uji habis dipakai tes (bukan bug). Stok diisi ulang, 28 kasus commerce+katalog diulang di semua browser: 28/28 lulus. Suite penuh tidak diulang utuh dalam satu putaran |
| SMTP eksternal | NOT_RUN | Dua tes SMTP loopback lulus; kredensial production belum tersedia |
| Bucket S3/R2 nyata | NOT_RUN | Validasi gambar/token/SigV4 diuji; kredensial bucket belum tersedia |
| Preview Vercel terbaru | PASS | Penyebab FAIL lama: `DATABASE_URL`/`DATABASE_CA_CERT` hanya ada di Production. Preview kini memakai `tokokita_preview`; halaman, pencarian dan login berjalan |
| Rilis production terbaru | PASS | `develop` 38370ce; publik HTTP 200, `/admin` dialihkan ke masuk, webhook tanda tangan palsu HTTP 401, log galat kosong |
| Cron pada domain resmi | NOT_RUN | Cron harian `0 17 * * *` terdaftar di Vercel; eksekusi pertama belum terjadi. 15 menit butuh Pro/GitHub secret |
| Backup/restore manual Aiven | PASS | Dump TLS 155.148 bytes, restore DB terpisah: 26 produk/14 pengguna/79 pesanan/188 ulasan/3 migration |
| Lighthouse DevTools mobile, 4G + CPU 4x | PASS | Beranda 93/LCP 2,344 s; katalog 93/2,351 s; detail 96/2,246 s; CLS <0,001. Build production dengan Aiven, cache hangat |
| Lighthouse simulasi bawaan | FAIL | Beranda 80, katalog 85, detail 85; LCP sekitar 4,3–4,4 s. Hasil kedua metode dipertahankan; domain Vercel belum diuji |
| Lighthouse produksi online (simulasi) | FAIL | Seluler perf 91–92, a11y/bp 100, LCP 2,9–3,1 s (> 2,5 s); desktop 100, LCP 0,5–0,6 s |
| Lighthouse produksi online (DevTools) | FAIL | Seluler perf 71–78, FCP 2,7–2,9 s, LCP 3,4–3,7 s |
| Latihan demo PPT 5 adegan | PASS | `demo-ppt.spec.ts` 30 dtk; 15 tangkapan layar di docs/screenshots/demo-ppt |
| Bayar sandbox online sampai lunas | NOT_RUN | Kunci sandbox dan Notification URL terpasang; butuh pembeli login di situs online |
| CI commit terakhir di GitHub | PASS | [Run 36880551063](https://github.com/Magang-Project-Cmlabs/ecommerce/actions/runs/36880551063), commit 35d5d60 (PR #25); `develop` 38370ce juga PASS |

## 4. Kriteria sukses PRD §22

| Kriteria | Status | Bukti / batas |
|---|---|---|
| Data di MySQL | PASS | E2E dan integrasi tanpa pesanan sukses palsu |
| Pencarian/filter/sort/grid/list/pagination | PASS | Tes katalog/navigasi |
| Detail/galeri/varian/ulasan | PASS | Katalog, commerce dan unggahan ulasan |
| Keranjang/jumlah/promo | PASS | Harga dihitung ulang server; unit dan E2E |
| Auth/reset/guard | PASS | Unit, integrasi dan E2E |
| Checkout/ongkir/tanpa overselling | PASS | Transaksi berebut stok terakhir; E2E empat langkah |
| Pembatalan otomatis/stok/promo kembali | PASS | MySQL/idempotensi; latihan demo memicu cron dan pesanan Dibatalkan. Jadwal online harian terdaftar, eksekusi NOT_RUN |
| Admin produk/stok/pesanan | PASS | Integrasi dan E2E lifecycle |
| Email perubahan status | NOT_RUN | Loopback membuktikan pengiriman setelah commit; belum SMTP eksternal |
| Riwayat/detail/timeline | PASS | E2E pembeli/admin |
| Performa/SEO/aksesibilitas | FAIL | Produksi online: skor seluler 91–92 (≥ 90) dan a11y/SEO 100, tetapi LCP seluler 2,9–3,7 s (> 2,5 s) |
| `npm run db:reset` menghasilkan demo lengkap | NOT_RUN | Tidak diulang pada 1 Okt: perintah destruktif memerlukan persetujuan. Migration/seed DB uji terpisah PASS; rangkaian reset PASS pada 27 Sep tercatat di PROGRESS |
| Responsif | PASS | Mobile 360 px/desktop dan QA mengacu PPT |

## 5. Sisa rilis

Butuh akun/tindakan pemilik (rincian dan skrip di [SERAH_TERIMA](SERAH_TERIMA.md)):

1. Cloudflare R2 → environment `STORAGE_DRIVER=s3`, `S3_*` (unggah gambar online).
2. SMTP → `SMTP_*`, `MAIL_FROM` (invoice, notifikasi status, lupa password).
3. Uji bayar sandbox di produksi sampai status Dibayar (pembeli login sendiri).
4. Cron 15 menit: Vercel Pro, atau secret `CRON_SECRET` + variabel `APP_URL` di GitHub Actions.
5. Jadwal backup dan retensi Aiven.
6. Bersihkan data demo di DB produksi sebelum dipakai pelanggan nyata; unggah foto asli.

Masih terbuka di sisi kode: LCP seluler > 2,5 s (FCP ~2,8 s di jaringan nyata) dan
QRIS sandbox (simulator error 2603).
