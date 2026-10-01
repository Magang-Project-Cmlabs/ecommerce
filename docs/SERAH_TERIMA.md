# Serah Terima — TokoKita

**Tanggal:** 1 Oktober 2026
**Branch:** `feat/penyelesaian-tokokita`
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

1. Simpan branch/PR dan pastikan CI hijau sebelum penggabungan.
2. Login `npx vercel login` dan tautkan proyek yang dikonfirmasi pemilik.
   Proyek fork yang terlihat sebelumnya: `ecommerce` di `tes-2254s-projects`.
   Akses GitHub tidak memberikan akses konfigurasi Vercel; CLI belum login.
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
