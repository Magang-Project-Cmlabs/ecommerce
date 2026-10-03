# Serah Terima — TokoKita

**Tanggal:** 3 Oktober 2026
**Branch:** `develop` memuat seluruh fitur (PR terakhir #48 ditambah PR dokumentasi ini).
Pekerjaan lanjutan ada di `feat/penyelesaian-tokokita` (dikirim lewat PR ke `develop`).
**Status lengkap:** [PROJECT_STATUS](PROJECT_STATUS.md) · log: [PROGRESS](PROGRESS.md)

## Lingkungan

| Lingkungan | Alamat | Database | Catatan |
|---|---|---|---|
| Produksi | https://ecommerce-peach-seven-47.vercel.app | Aiven `tokokita` | Publik; dibangun dari `develop` repo `kvnlhm/ecommerce` |
| Preview | ecommerce-git-feat-penyelesaian-tokokita-tes-2254s-projects.vercel.app | Aiven `tokokita_preview` | Perlu login Vercel; boleh di-seed ulang |
| Lokal demo | http://localhost:3000 | MySQL `ecommerce` | `db:reset` menghapus data, minta persetujuan |
| Lokal QA | http://localhost:3002 | MySQL `ecommerce_verifikasi_20261001` | Untuk E2E; lihat di bawah |

Vercel: proyek `ecommerce` di tim `tes-2254s-projects`, CLI sudah login. Repo
`kvnlhm/ecommerce` adalah cermin; Vercel membangun saat ada push ke sana.
Menyalin `develop` organisasi ke cermin dilakukan hanya setelah PR di-merge:
`IZINKAN_PUSH_LANGSUNG=1 git push personal origin/develop:refs/heads/develop`.

Berkas lokal Git-ignored (jangan dicetak/di-commit): `.env`, `.env.aiven`,
`.env.local`, `tests/e2e/.env.e2e`, `.env.akun-preview` (akun admin/pembeli
Preview), `.env.akun-produksi` (akun admin/pembeli Produksi, kata sandi acak),
`.env.smtp` dan `.env.asisten` (kunci Gmail SMTP dan kunci AI), `.env.otomasi`
(`CRON_SECRET` produksi, kunci pembuka backup, password pengguna backup).

## Sudah aktif

- Environment Vercel Preview + Production: DB (dengan CA), `AUTH_SECRET`,
  `CRON_SECRET`, `APP_URL`, `STORE_CITY`, `MIDTRANS_SERVER_KEY` (sandbox),
  `MIDTRANS_IS_PRODUCTION=false`. Notification URL Midtrans sandbox menunjuk
  `/api/payment/midtrans` di domain produksi (diatur pemilik).
- Cron harian Vercel `0 17 * * *` (00.00 WIB) ke `/api/cron/orders`.
- Foto produk demo CC0 sesuai produk ([KREDIT_FOTO](KREDIT_FOTO.md)); banner dan
  ubin kategori juga foto CC0 (kredit di berkas yang sama).
- Latihan demo PPT otomatis dan rekaman cadangan: [DEMO](DEMO.md).
- Unggah gambar online lewat Vercel Blob (`STORAGE_DRIVER=blob`, D15) dan email Gmail SMTP terpasang di Vercel.
- PPT `docs/Presentasi_ECommerce_TokoKita.pptx` dibangun ulang 3 Okt 2026: 22 slide, tema monokrom sesuai tampilan web, tangkapan layar terbaru (terang, gelap, admin modal, Tanya AI), catatan pembicara di setiap slide; sudah dirender di PowerPoint dan diperiksa.
- Tampilan toko dan admin mengikuti [DESIGN.md](../DESIGN.md): gaya template Framer, monokrom, mode terang + gelap (D16); admin satu bahasa visual dengan toko, tambah/edit lewat modal, semua daftar pilihan memakai komponen `Pilihan` (tanpa `<select>` bawaan), keluar selalu dikonfirmasi.
- Password memakai Argon2id (D17); hash bcrypt lama diganti otomatis saat pengguna berhasil masuk.
- Pilihan bisa dicari, lencana status bergaya monokrom, dan asisten "Tanya AI" (D18) aktif; `ASISTEN_API_KEY` (Gemini) dan `ASISTEN_CADANGAN_API_KEY` (Groq), keduanya kunci gratis milik pemilik, terpasang di Vercel Preview + Production sejak 3 Okt 2026. Pengaman: topik dibatasi ke belanja di toko, tanpa tools/SQL, batas 20 pertanyaan/10 menit dan 100/hari per pengguna atau IP, 1.500/hari untuk seluruh toko; uji penyalahgunaan 16/16 ditolak. Darurat (mis. kuota disalahgunakan): pasang `ASISTEN_NONAKTIF=1` di Vercel lalu deploy ulang untuk mematikan asisten. Mengganti kunci: ubah `.env.asisten`, lalu `node scripts/pasang-env-vercel.mjs .env.asisten`.

## Fitur lanjutan menunggu rilis (setelah presentasi)

Branch `feat/lanjutan-ongkir-resi-google`: ongkir per zona provinsi (D19), lacak resi Binderbyte (D20),
Login Google (D21). Pemilik membuat OAuth Client Google dan akun Binderbyte lalu memasang kunci;
langkah lengkap dan urutan rilis (migration produksi dulu, baru merge) di
[runbook](runbooks/login-google-dan-lacak-resi.md). Setelah rilis: perbarui PPT dan contekan
(ongkir luar Jawa berubah; Jawa tetap).

## Menunggu pemilik

1. Uji manusia di produksi: selesai 3 Okt. Bayar sandbox BCA sampai Dibayar PASS (pesanan uji INV-202610-0001 kemudian dibatalkan admin dengan status pembayaran Dikembalikan; stok Kabel USB-C kembali 62), email "Lupa password" diuji pemilik (aman), password akun admin/pembeli demo produksi sudah diganti pemilik, nama di halaman Midtrans "TokoKita". Berkas lokal `.env.akun-produksi` masih berisi password lama: perbarui atau hapus.
2. Tinjau isi PPT 22 slide dan sesuaikan nama/peran tim bila perlu.
3. Pesanan otomatis tiap jam dan backup harian: secret sudah dipasang lewat `node scripts/pasang-otomasi-github.mjs` (3 Okt); workflow aktif di branch `sinkron` repo pribadi dan run pertama keduanya PASS (3 Okt). Simpan salinan `.env.otomasi` (kunci pembuka backup) di tempat aman. Panduan: [backup-restore](runbooks/backup-restore.md).
4. Foto produk asli dan pembersihan data demo produksi sebelum dipakai pelanggan nyata.
5. Nilai tampilan baru (toko dan admin, terang dan gelap) di situs online; sebutkan bagian yang masih kurang.

Pembayaran uang asli butuh akun Midtrans produksi atas nama badan usaha; di
luar cakupan magang.

## Terbuka di sisi kode

- LCP seluler (simulasi Lighthouse, Chrome bersih): beranda 1,7 s (98), katalog 2,5 s (96); detail 3,1 s (91) masih di atas 2,5 s, sedangkan dengan throttling devtools 2,4 s.
- QRIS sandbox: simulator resmi error 2603.
- Verifikasi baca ulang akun produksi (kata sandi seed tidak berlaku) belum dijalankan.

## Menjalankan QA lanjutan

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

Opt-in tambahan: `E2E_MIDTRANS_SANDBOX=1` (Snap + simulator) dan `E2E_DEMO=1`
(latihan demo PPT). Jalankan browser, Lighthouse dan runner sandbox secara
berurutan. Akun uji berada di `.env.e2e`; jangan mencetak kredensial.

`npm run typecheck`, `npm run lint`, `npm run test`, `npx prisma validate`,
`npm run build`, `npm run test:integration`, `npm run e2e`.

Output Playwright berada di `tests/e2e/.artifacts/playwright/`. Tes integrasi
menolak nama DB toko. `npm run db:deploy` menyediakan CA sementara bagi engine
migrasi Aiven. `db:reset`/`db:seed` menghapus data.
