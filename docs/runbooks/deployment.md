# Deployment — Vercel + Aiven

Target pemilik proyek sejak 1 Oktober 2026: Vercel dan Aiven, menggantikan
VPS pada PRD lama. Konfigurasi proyek tersedia di `vercel.json`.

## Konfigurasi Vercel

- Framework Next.js, Node 22 atau 24, root directory repo ini.
- Install: `npm ci --ignore-scripts && npx prisma generate`.
  `prepare` mengatur Git hook, sehingga dilewati pada folder build tanpa Git.
- Build: `npm run build`; output directory mengikuti Next.js.
- Region awal `sin1` (Singapura); samakan dengan lokasi layanan Aiven.
- Environment Production dan Preview dipisahkan. Preview sebaiknya memakai
  database uji sendiri agar tes tidak mengubah data toko.
- Production branch harus menunjuk commit integrasi yang telah diverifikasi;
  branch lokal `feat/penyelesaian-tokokita` belum otomatis menjadi production.

## Environment

Nilai rahasia dimasukkan lewat Vercel Environment Variables, bukan Git.

| Variabel | Kebutuhan |
|---|---|
| `DATABASE_URL` | URL MySQL Aiven; tambahkan `connectionLimit=3&connectTimeout=10000` |
| `DATABASE_CA_CERT` | PEM CA dari Aiven, termasuk BEGIN/END; baris asli atau `\n` |
| `APP_URL` | Domain HTTPS resmi; digunakan email, metadata dan return pembayaran |
| `AUTH_SECRET` | Acak ≥32 karakter; tetap sama antar instance/deployment agar sesi konsisten |
| `CRON_SECRET` | Rahasia untuk header Bearer pemanggil cron |
| `STORE_CITY` | Kota asal toko, default Jakarta |
| `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` | SMTP nyata untuk reset password dan notifikasi (produksi: Gmail SMTP + App Password) |
| `STORAGE_DRIVER` | `blob` (dipakai produksi, D15) atau `s3`; `local` ditolak di production |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob; terisi otomatis saat store Blob dihubungkan ke proyek |
| `S3_ENDPOINT/BUCKET/ACCESS_KEY/SECRET_KEY/PUBLIC_URL` | Hanya bila `STORAGE_DRIVER=s3` (bucket S3/R2) |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION` | Sandbox untuk demo; production hanya jika akun merchant siap |
| `PAYMENT_SIMULATION_ENABLED` | `false`; production selalu menolak simulasi |
| `ASISTEN_API_KEY` (+ `ASISTEN_BASE_URL`, `ASISTEN_MODEL` opsional) | Kunci gratis Google AI Studio (Gemini) untuk "Tanya AI"; tanpa kunci tombol tidak tampil (D18) |
| `ASISTEN_CADANGAN_API_KEY` (+ `_BASE_URL`, `_MODEL` opsional) | Kunci gratis Groq sebagai cadangan bila Gemini penuh |
| `ASISTEN_NONAKTIF` | `1` mematikan asisten seketika setelah deploy ulang (tombol darurat) |

Koneksi Aiven memverifikasi CA; jangan menonaktifkan verifikasi sertifikat.
Environment build juga memerlukan `DATABASE_URL`, karena Next memuat modul
server saat mengumpulkan route. Build tidak perlu melakukan reset/seed.

## Database dan rilis

1. Uji koneksi TLS dari environment Aiven tanpa mencetak URL/password.
2. Jalankan `npm run db:deploy` dengan environment Aiven sebelum
   deployment aplikasi baru. Migration bersifat tambahan; jangan `db:reset`.
   Wrapper `scripts/migrate-deploy.mjs` menyediakan CA PEM sementara untuk
   engine Prisma Migrate dan menetapkan `sslaccept=strict`; adapter runtime
   membaca CA langsung dari environment. Contoh lokal:
   `node --env-file=.env.aiven scripts/migrate-deploy.mjs`.
3. Deploy commit terverifikasi melalui Git integration atau `vercel --prod`.
4. Periksa build log dan halaman HTTPS, kemudian login customer/admin asli.
5. Uji unggah gambar, checkout, pembayaran, email dan cron pada domain resmi.

Untuk demo, 26 produk seed yang sudah ada dapat tetap dipakai. Seed bersifat
destruktif dan tidak perlu dijalankan lagi. `npm run demo:images` hanya
memindahkan URL foto Picsum milik seed ke aset lokal; tidak mereset data.

## Perilaku serverless

- Rate limit login/daftar/reset memakai tabel bersama `auth_rate_limits` pada
  production. Kunci IP disimpan sebagai HMAC; instance tidak mempunyai kuota
  terpisah. Di Vercel hanya `x-vercel-forwarded-for` yang dipercaya.
- Unggah produk maksimal 8 foto, ulasan maksimal 3 foto, masing-masing ≤2 MB.
  Foto ulasan harus terikat item pesanan sendiri yang layak diulas, dengan
  kuota bersama 5 file/15 menit per item. Browser mengunggah satu file per
  request, lalu mengirim token bertanda
  tangan yang terikat pengguna dan tujuan. Request final tidak membawa file.
- Batas Server Actions 3 MB; batas Vercel 4,5 MB tidak dapat dinaikkan dengan
  Next config. File product minimal 800×800; banner/category mengikuti desain.
- `STORAGE_DRIVER=local` hanya development; filesystem Vercel bukan storage
  permanen. Token unggah tidak mengizinkan URL bebas atau foto pengguna lain.
- Email dikirim setelah commit; kegagalan SMTP tidak membatalkan pesanan.

## Cron

Endpoint `GET /api/cron/orders` memerlukan `Authorization: Bearer CRON_SECRET`.
Ia membatalkan pending lewat 24 jam dan menyelesaikan shipped lewat 7 hari,
memeriksa ulang kondisi dalam transaksi dan aman dipanggil berulang.

Vercel Hobby membatasi cron sekali sehari, sehingga tidak memenuhi 15 menit.
`vercel.json` sudah memasang cron harian `0 17 * * *` (00.00 WIB) sebagai jaring
pengaman: hanya berjalan pada deployment Production, dan Vercel mengirim
`CRON_SECRET` sendiri. Untuk ketepatan 15 menit, pilih salah satu:

- Pro: tambahkan cron `*/15 * * * *` ke Vercel, secret dikirim otomatis.
- Hobby: penjadwal eksternal memanggil URL dengan header Bearer setiap 15 menit.
  Alternatif yang sudah disiapkan: `.github/workflows/orders-cron.yml`;
  isi GitHub Actions variable `APP_URL` dan secret `CRON_SECRET`.

GitHub scheduled workflows memakai default branch dan dapat terlambat.
Periksa kuota Actions pada repo private sebelum mengaktifkan jadwal penuh.
Untuk uji manual: `node --env-file=.env scripts/run-orders-cron.mjs`.

## Backup dan verifikasi online

Periksa backup yang tersedia pada paket Aiven, retensi dan uji restore ke
database terpisah. Jika paket tidak menyediakan backup yang sesuai PRD,
gunakan backup MySQL terjadwal ke storage terpisah. Jangan simpan dump di Git.

Backup manual TLS dan restore Aiven telah diuji pada 1 Oktober 2026 ke
DB lokal terpisah: 26 produk, 14 pengguna, 79 pesanan, 188 ulasan dan tiga
migration. Dump hanya lokal dan diabaikan Git; jadwal/retensi backup cloud
belum dikonfigurasi.

Status online per 3 Oktober 2026: domain/build, query TLS, unggah Vercel Blob,
login SMTP, webhook Midtrans dan asisten AI `PASS`; restore manual `PASS`;
pemanggil cron terjadwal dan jadwal backup `NOT_RUN`. Tes lokal tidak
membuktikan konfigurasi akun hosting sudah aktif. Untuk memasang variabel dari
berkas lokal tanpa mencetak nilainya: `node scripts/pasang-env-vercel.mjs <berkas>`.

Sumber platform: [Vercel request headers](https://vercel.com/docs/headers/request-headers),
[batas Functions](https://vercel.com/docs/functions/limitations),
[batas cron](https://vercel.com/docs/cron-jobs/usage-and-pricing),
[Aiven TLS CA](https://aiven.io/docs/platform/concepts/tls-ssl-certificates).
