# Serah Terima — TokoKita

**Tanggal:** 1 Oktober 2026
**Branch:** `feat/penyelesaian-tokokita`

**PR:** [#23](https://github.com/Magang-Project-Cmlabs/ecommerce/pull/23), draft; implementasi sudah di-commit dan di-push.
**Sesi:** Penyelesaian PPT/PRD dan perubahan target Vercel + Aiven

## Keadaan aplikasi

Branch mengintegrasikan `develop` (`1fb10162`) dan `feature` (`2d01e28`),
ditambah katalog/admin lengkap dan perbaikan checkout, akun, pesanan,
pembayaran dan keamanan. Bukti serta layanan yang belum diuji ada di
[PROJECT_STATUS](PROJECT_STATUS.md).

Database lokal `ecommerce` dan Aiven `tokokita` mempertahankan data lama.
Migration tambahan `20261001080000_auth_rate_limits` terpasang di keduanya.
Tes mutasi memakai `ecommerce_verifikasi_20261001` yang terpisah.
Jangan menjalankan seed/reset pada toko untuk melanjutkan.

Foto seed tersedia di `public/demo/`; production upload wajib S3/R2.
`.env`, `.env.aiven` dan `tests/e2e/.env.e2e` hanya lokal, diabaikan Git.

## Langkah berikutnya

1. CI PR #23 sudah PASS (run 36839552818, commit 8d8696a).
   Periksa CI setiap commit lanjutan sebelum penggabungan. Server demo lokal berjalan
   di http://localhost:3000 dengan DB toko lokal `ecommerce` (bukan DB uji).
2. Login `npx vercel login` dan tautkan proyek yang dikonfirmasi pemilik.
   Proyek fork yang terlihat sebelumnya: `ecommerce` di `tes-2254s-projects`.
   Integrasi Git repo pribadi sudah menjalankan preview commit 1acd7c2, tetapi
   deployment FAIL: [log Vercel](https://vercel.com/tes-2254s-projects/ecommerce/9g2dyzipY6uL8Q46t1iAhoH1yXxD).
   Penyebab belum diketahui; CLI belum login untuk membaca log atau konfigurasi.
3. Isi environment Production/Preview, SMTP dan S3/R2 mengikuti
   [runbook deployment](runbooks/deployment.md). Preview sebaiknya memakai DB
   uji terpisah agar tes tidak mengubah toko.
4. Deploy commit integrasi. Uji HTTPS, login, upload, checkout, email dan
   Midtrans sandbox; deployment lama belum memuat fitur ini.
5. Aktifkan cron 15 menit melalui Vercel Pro atau penjadwal eksternal.
   Workflow GitHub tersedia tetapi environment target belum diaktifkan.
6. Ukur Lighthouse beranda/katalog/detail dan tutup target ≥90/LCP <2,5 detik.
   Restore manual Aiven ke DB terpisah sudah PASS (26/14/79/188, tiga migration); penjadwalan dan retensi backup masih perlu dikonfigurasi.

## Verifikasi ulang

`npm run typecheck`, `npm run lint`, `npm run test`, `npx prisma validate`,
`npm run build`, `npm run test:integration`, `npm run e2e`.

Konfigurasi E2E lokal diabaikan Git. Output Playwright kini berada di
`tests/e2e/.artifacts/playwright/`, sehingga tidak menghapus log MySQL
atau bukti manual pada folder induk. Tes integrasi menolak nama DB toko.

`npm run db:deploy` menyediakan CA sementara bagi engine migrasi Aiven.
`npm run demo:images` hanya memperbarui foto seed. `db:reset`/`db:seed`
menghapus data; keduanya tidak diperlukan untuk deployment ini.
