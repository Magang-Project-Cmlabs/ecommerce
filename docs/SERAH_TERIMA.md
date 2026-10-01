# Serah Terima — TokoKita

**Tanggal:** 1 Oktober 2026
**Branch:** `feat/penyelesaian-tokokita`

**PR:** [#23](https://github.com/Magang-Project-Cmlabs/ecommerce/pull/23), draft.
**Keadaan:** Codex dihentikan sementara atas permintaan pemilik agar token hemat;
lanjutkan melalui Claude Code. Commit terakhir `984d01f` sudah di-push,
tetapi perubahan sesi terakhir sudah di-commit (`2fcc207`) dan di-push. Jangan reset/checkout
ulang atau membuang working tree.
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

1. Baca CLAUDE.md, MULAI_DI_SINI dan PROJECT_STATUS. Lanjutkan perubahan lokal
   di branch ini; kepemilikan tugas anggota tetap berlaku. CI commit terakhir
   PASS (run 36852310169, commit 2fcc207, perubahan lokal sudah di-commit dan di-push).
   Periksa CI setiap commit lanjutan sebelum penggabungan. Server demo lokal berjalan
   di http://localhost:3000 dengan DB toko lokal `ecommerce` (bukan DB uji).
2. Vercel: CLI sudah login (akun `kevinilhamka-2254`), proyek `ecommerce` di
   `tes-2254s-projects`. Preview gagal sebelumnya karena `DATABASE_URL` dan
   `DATABASE_CA_CERT` hanya ada untuk Production. Sekarang Preview memakai DB
   uji terpisah `tokokita_preview` di server Aiven yang sama (tiga migration
   terpasang, kosong, bukan DB toko). Build Preview PASS; `/`, `/produk`, `/masuk`,
   `/daftar` dan `/api/search` HTTP 200 (PASS, via `vercel curl`). Login, checkout,
   upload, email dan Midtrans di Preview masih NOT_RUN. Mengganti env rahasia:
   hapus lalu tambah ulang, lalu `vercel redeploy` (env terikat saat deployment dibuat).
3. Isi environment Production/Preview, SMTP dan S3/R2 mengikuti
   [runbook deployment](runbooks/deployment.md). Preview sebaiknya memakai DB
   uji terpisah agar tes tidak mengubah toko.
4. Deploy commit integrasi. Uji HTTPS, login, upload, checkout, email dan
   Midtrans sandbox; deployment lama belum memuat fitur ini.
5. Aktifkan cron 15 menit melalui Vercel Pro atau penjadwal eksternal.
   Workflow GitHub tersedia tetapi environment target belum diaktifkan.
6. Ulangi suite lintas browser versi akhir dan ukur Lighthouse
   beranda/katalog/detail; tutup target ≥90/LCP <2,5 detik.
   Restore manual Aiven ke DB terpisah sudah PASS (26/14/79/188, tiga migration); penjadwalan dan retensi backup masih perlu dikonfigurasi.

## Verifikasi ulang

### Perubahan lokal yang harus dipertahankan

- Query katalog/detail paralel; unit baru katalog. Median read-only Aiven:
  detail 584→420 ms, katalog 641→425 ms; harga/stok tetap fresh, tanpa preview
  Prisma relationJoins atau perubahan skema.
- Produk beranda memakai Suspense/skeleton; validasi ReviewForm dimuat saat
  submit sehingga chunk Zod tidak masuk HTML awal tamu.
- SearchBox menunggu hydration sebelum menerima input; WishlistProvider
  membuang refresh berlebih setelah action revalidatePath.
- Konfirmasi Midtrans memeriksa attempt aktif **setelah row lock**. Stale
  settlement menghasilkan perlu-tindakan-admin, tidak menimpa ID baru.
  Tes regresi TDD unit dan transaksi MySQL baru tersedia.
- Playwright opt-in Edge/Firefox/WebKit dan mobile WebKit; global channel Chrome
  dihapus agar engine lain tidak mewarisinya. Default tetap Chrome/Android.
- Fixture ulasan unik per kasus; ukuran multipart diukur melalui browser
  Request agar binary WebKit ikut dihitung. Cookie SameSite diperiksa dari
  atribut Set-Cookie tanpa mencetak JWT. Limiter production tidak dilonggarkan.
- Tes sandbox opt-in BCA/Mandiri/QRIS, fixture invoice sah dan cleanup milik
  akun uji. BCA/Mandiri PASS; QRIS FAIL pada simulator resmi error 2603,
  meskipun URL sama dengan qris_url Snap dan PNG HTTP 200. Jangan menandai
  kanal itu selesai atau mengabaikan kegagalannya.
- distDir khusus E2E `.sandbox/next-e2e`, ignore ESLint dan include typegen
  ditambahkan; tidak menimpa build `.next` atau demo pengguna.

### Bukti terbaru sebelum penghentian

Typecheck PASS, lint PASS, 403 unit PASS (dua network test dipisahkan),
30 integrasi MySQL PASS, build 31 route PASS, release:prepare PASS.
Regresi Firefox/WebKit akun/katalog/ulasan 24/24 PASS. BCA dan Mandiri:
Snap→simulator→API settlement→Cek Pembayaran→DB paid/confirmed, log sekali,
webhook ulang idempoten dan signature palsu HTTP 401 PASS.

Runner penuh 310 kasus **dihentikan pemilik**, setelah 89 kasus lulus
(Chrome/Android 83 + enam Edge). Ini **bukan PASS suite penuh**. Server QA
3001 (production/Aiven) dan 3002 (dev/DB uji) dihentikan; demo 3000 tidak
disentuh. Performa build terbaru belum diukur: jangan menyalin skor lama
sebagai hasil baru. Metode DevTools sebelumnya PASS, simulasi bawaan FAIL.

Bukti di folder Git-ignored `tests/e2e/.artifacts/`: `cross-native-first`
(150/155), `cross-targeted-pass` (24/24), `payment-bca-pass`,
`payment-matrix-first`, `payment-qris-provider-failure`. Jangan gunakan
`cross-browser-first-report.*` sebagai bukti: artifact tersebut berasal dari
`--list` dan seluruh kasus SKIP.

### Menjalankan QA lanjutan

Server uji wajib memuat `.env` lalu `tests/e2e/.env.e2e` override,
`NODE_ENV=development`, `E2E_ISOLATED_SERVER=1`, `APP_URL=http://localhost:3002`,
tanpa VERCEL; jalankan Next dev port 3002. Pastikan DATABASE_URL menunjuk
`ecommerce_verifikasi_20261001`, bukan ecommerce/tokokita. Untuk runner:

```powershell
$env:E2E_BASE_URL = 'http://localhost:3002'
$env:E2E_CROSS_BROWSER = '1'
Remove-Item Env:E2E_MIDTRANS_SANDBOX -ErrorAction SilentlyContinue
npm.cmd run e2e
```

Jalankan browser, Lighthouse dan runner sandbox secara berurutan; folder
artifact Playwright dibersihkan setiap runner. Akun uji berada di `.env.e2e`;
jangan mencetak kredensial. Lalu perbarui status, commit perubahan yang sudah
ditinjau, push branch org dan tunggu CI; PR tetap draft sampai rilis terverifikasi.

`npm run typecheck`, `npm run lint`, `npm run test`, `npx prisma validate`,
`npm run build`, `npm run test:integration`, `npm run e2e`.

Konfigurasi E2E lokal diabaikan Git. Output Playwright kini berada di
`tests/e2e/.artifacts/playwright/`, sehingga tidak menghapus log MySQL
atau bukti manual pada folder induk. Tes integrasi menolak nama DB toko.

`npm run db:deploy` menyediakan CA sementara bagi engine migrasi Aiven.
`npm run demo:images` hanya memperbarui foto seed. `db:reset`/`db:seed`
menghapus data; keduanya tidak diperlukan untuk deployment ini.
