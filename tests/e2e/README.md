# Tes End-to-End (E2E)

Tes ini membuka TokoKita di browser sungguhan dan memeriksanya seperti pengguna
biasa. Kalau perubahan kode diam-diam merusak sebuah halaman, tes ini yang
ketahuan lebih dulu, sebelum pembeli yang menemukannya.

> **Status:** semua halaman di `helpers/pages.ts` sudah aktif diuji. Suite
> mencakup katalog, akun, lifecycle checkout/pesanan/ulasan dan admin.
> Tes mutasi wajib memakai database uji terpisah dan `tests/e2e/.env.e2e`;
> jangan reset atau memakai database toko/Aiven untuk E2E.

## Yang diperiksa

| Berkas | Isinya |
|---|---|
| `specs/akun.spec.ts` | Daftar, masuk, keluar dengan konfirmasi (Batal lalu Ya, keluar); pesan gagal seragam; cookie httpOnly 30 hari; open redirect lewat `next` ditolak |
| `specs/navigation.spec.ts` | Semua halaman dibuka satu per satu: tanpa galat HTTP, tanpa error JavaScript, tepat satu `<h1>` |
| `specs/auth-guard.spec.ts` | Tamu dialihkan ke `/masuk?next=…`; pembeli tidak bisa membuka `/admin` |
| `specs/accessibility.spec.ts` | Pemindaian axe-core (WCAG 2.1 AA, tingkat serious & critical) |
| `specs/responsive.spec.ts` | Layar 360 px: tidak melebar, tombol minimal 44×44 px |
| `specs/katalog.spec.ts` | Saran keyboard, filter/list/pagination, varian, zoom, wishlist dan metadata |
| `specs/commerce.spec.ts` | Checkout nyata, admin konfirmasi/kirim, pembeli terima/ulasan, batal dan IDOR |
| `specs/asisten.spec.ts` | Panel "Tanya AI": terbuka/tertutup, data sensitif ditolak dan disamarkan, jawaban atau pesan jelas bila AI belum aktif, tidak tampil di checkout |
| `specs/admin.spec.ts` | Produk delapan foto, stok/arsip, kategori/promo/banner (tambah/edit lewat modal) dan transisi pesanan. Daftar pilihan dipilih lewat `helpers/pilihan.ts` (`pilihOpsi`), bukan `selectOption` |
| `specs/review-upload.spec.ts` | Tiga foto hampir 2 MB/file, token unggah dan batas request |

Race stok/promo dan pembatalan otomatis juga diuji pada suite integrasi MySQL
(`npm run test:integration`) dengan penjagaan nama database uji.

## Persiapan sekali saja

Butuh proyek yang sudah di-scaffold, **Node.js 20+**, dan **Google Chrome**.
Browser tidak perlu diunduh terpisah.

1. Pasang perkakasnya (sekali, oleh A1 saat scaffold):
   ```bash
   npm i -D @playwright/test @axe-core/playwright
   ```
   dan pastikan `package.json` punya skrip:
   ```json
   "e2e": "playwright test -c tests/e2e/playwright.config.ts",
   "e2e:report": "playwright show-report tests/e2e/.report"
   ```
2. Salin berkas contoh dan isi akun uji:
   ```bash
   cp tests/e2e/.env.e2e.example tests/e2e/.env.e2e
   ```
3. Arahkan `DATABASE_URL` ke database uji terpisah. Jalankan migration; seed
   hanya untuk database uji baru/kosong, dengan memahami bahwa seed menghapus data.

> **PowerShell:** kalau muncul *"npm.ps1 cannot be loaded"*, ketik `npm.cmd`
> sebagai ganti `npm` (mis. `npm.cmd run e2e`), atau jalankan sekali
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Menjalankan

```bash
npm run e2e                                                   # semua
npx playwright test -c tests/e2e/playwright.config.ts navigation   # satu berkas
npx playwright test -c tests/e2e/playwright.config.ts --headed      # lihat browsernya
npm run e2e:report                                            # laporan kegagalan
```

Tanpa `E2E_BASE_URL`, Playwright menyalakan `npm run dev` sendiri atau memakai
server yang sudah menyala di port 3000.

## Verifikasi lintas browser

Default tetap Chrome desktop dan Android 360 px. Untuk suite tambahan,
pasang `npx playwright install firefox webkit` dan Microsoft Edge, lalu:

```powershell
$env:E2E_CROSS_BROWSER = '1'
npm run e2e -- --project=edge --project=firefox --project=webkit --project=mobile-webkit
```

Mode ini memakai satu worker agar browser tidak saling mengubah fixture DB.
WebKit desktop/iPhone adalah pengujian engine WebKit melalui Playwright;
hasilnya tidak membuktikan seluruh versi Safari atau perangkat iOS fisik.
Setiap browser memakai login nyata dan seluruh suite desktop/mobile terkait.

Untuk menjalankan server uji bersamaan dengan demo lokal, gunakan port berbeda
dan `E2E_ISOLATED_SERVER=1` pada proses Next.js. Build uji akan memakai
`.sandbox/next-e2e`, yang diabaikan Git. Isi environment database uji pada proses
server juga; `E2E_BASE_URL` hanya menentukan alamat yang dibuka browser.

## Midtrans sandbox nyata (opt-in)

Tes `payment-sandbox.spec.ts` dikecualikan dari suite biasa. Untuk menguji BCA,
Mandiri dan QRIS melalui Snap dan simulator resmi, gunakan server lokal dengan database uji,
kunci sandbox Midtrans dan kredensial pembeli uji, lalu:

```powershell
$env:E2E_BASE_URL = 'http://localhost:3002'
$env:E2E_MIDTRANS_SANDBOX = '1'
npm.cmd run e2e -- payment-sandbox --project=desktop
```

Tes membuat dan membersihkan fixture bertanda khusus, memeriksa API settlement,
status/log DB setelah tombol Cek Pembayaran, webhook ulang serta signature palsu.
Domain sandbox, mode/kunci sandbox, localhost dan nama database uji diperiksa
sebelum simulasi. Authorization API memakai Node fetch agar tidak masuk trace
browser. Ini tidak membuktikan webhook internet atau pembayaran production.

## Aturan yang dipelajari dengan mahal

- **Sapu semua halaman.** Halaman baru = satu baris di `helpers/pages.ts`.
- **Jangan memalsukan sesi.** Login selalu lewat form `/masuk`. Sesi disimpan di
  `tests/e2e/.auth/` (diabaikan Git) dan dipakai ulang selama masih berlaku.
- **`waitUntil: 'load'`, bukan `'networkidle'`** — koneksi HMR dev server
  membuat `networkidle` tidak pernah tercapai.
- **Emulasi HP lewat project `mobile`**, bukan sekadar mengecilkan viewport.
- **`ERR_CONNECTION_REFUSED` massal** = server atau MySQL mati, bukan kode rusak.
- Tes login bergantung pada label **Email** dan **Password**/**Kata sandi** serta
  tombol **Masuk** di halaman `/masuk`. Mengganti teks itu berarti memperbarui
  `helpers/auth.ts`.
