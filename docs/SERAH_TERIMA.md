# Serah Terima — TokoKita

**Tanggal:** 3 Oktober 2026
**Branch:** `develop` sudah memuat PR #23 dan #25. Pekerjaan lanjutan ada di
`feat/penyelesaian-tokokita` (dikirim lewat PR ke `develop`).
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
Preview), `.env.akun-produksi` (akun admin/pembeli Produksi, kata sandi acak).

## Sudah aktif

- Environment Vercel Preview + Production: DB (dengan CA), `AUTH_SECRET`,
  `CRON_SECRET`, `APP_URL`, `STORE_CITY`, `MIDTRANS_SERVER_KEY` (sandbox),
  `MIDTRANS_IS_PRODUCTION=false`. Notification URL Midtrans sandbox menunjuk
  `/api/payment/midtrans` di domain produksi (diatur pemilik).
- Cron harian Vercel `0 17 * * *` (00.00 WIB) ke `/api/cron/orders`.
- Foto produk demo CC0 sesuai produk ([KREDIT_FOTO](KREDIT_FOTO.md)); banner dan
  ubin kategori juga foto CC0 (kredit di berkas yang sama).
- Latihan demo PPT otomatis dan rekaman cadangan: [DEMO](DEMO.md).
- Unggah gambar online lewat Vercel Blob (`STORAGE_DRIVER=blob`, D15), email Gmail terpasang di Vercel, PPT diperbarui (slide 1, 5–7, 10–13, 16, 19, 20).
- Tampilan toko dan admin mengikuti [DESIGN.md](../DESIGN.md): gaya template Framer, monokrom, mode terang + gelap (D16); admin satu bahasa visual dengan toko, tambah/edit lewat modal, semua daftar pilihan memakai komponen `Pilihan` (tanpa `<select>` bawaan), keluar selalu dikonfirmasi.
- Password memakai Argon2id (D17); hash bcrypt lama diganti otomatis saat pengguna berhasil masuk.
- Pilihan bisa dicari, lencana status bergaya monokrom, dan asisten "Tanya AI" (D18) aktif; `ASISTEN_API_KEY` (Gemini, kunci milik pemilik) terpasang di Vercel Preview + Production sejak 3 Okt 2026. Darurat (mis. kuota disalahgunakan): pasang `ASISTEN_NONAKTIF=1` di Vercel lalu deploy ulang untuk mematikan asisten. Cadangan Groq aktif bila `ASISTEN_CADANGAN_API_KEY` dipasang (tambahkan baris itu di `.env.asisten`, lalu `node scripts/pasang-env-vercel.mjs .env.asisten`).

## Menunggu pemilik

1. Uji manusia di produksi: daftar pembeli baru, bayar sandbox BCA sampai Dibayar (HEMAT10 minimal belanja Rp 100.000), unggah gambar lewat admin, cek email "Lupa password".
2. Tinjau PPT di PowerPoint (render slide tidak diuji di mesin pengembang).
3. Cron 15 menit (Vercel Pro atau secret GitHub Actions) dan jadwal backup Aiven; cadangan manual 1 Okt ada di luar repo.
4. Foto produk asli dan pembersihan data demo produksi sebelum dipakai pelanggan nyata.
5. Nilai tampilan baru (toko dan admin, terang dan gelap) di situs online; sebutkan bagian yang masih kurang.

Pembayaran uang asli butuh akun Midtrans produksi atas nama badan usaha; di
luar cakupan magang.

## Terbuka di sisi kode

- LCP seluler produksi 2,9–3,7 s (target < 2,5 s); FCP sekitar 2,8 s di jaringan nyata.
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
