# Status Proyek — TokoKita

**Repo:** `Magang-Project-Cmlabs/ecommerce` (private) · cermin `kvnlhm/ecommerce` (sumber deploy Vercel)
**Branch integrasi:** `develop` (terakhir PR #62, fitur lanjutan D19–D21); pekerjaan lanjutan lewat PR
**Diperbarui:** 3 Oktober 2026 · riwayat per sesi ada di [PROGRESS](PROGRESS.md)

## 1. Ringkasan

TokoKita sudah **berjalan online** di https://ecommerce-peach-seven-47.vercel.app
(Vercel `sin1` + Aiven MySQL `tokokita`). Semua fitur MVP dan fitur lanjutan PRD
memakai database nyata: katalog, pencarian, keranjang, checkout 4 langkah, ongkir
sesuai berat, promo, akun, pesanan, ulasan terverifikasi, wishlist, dan panel admin.

Tambahan di luar rencana awal: pembayaran **Midtrans Snap sandbox**, unggah gambar
**Vercel Blob**, email **Gmail SMTP**, tampilan bergaya template Framer dengan
**mode terang/gelap** (D16), password **Argon2id** (D17), dan asisten **"Tanya AI"**
(D18, Gemini dengan cadangan Groq, pengaman berlapis). Rilis 3 Okt malam: **ongkir per zona provinsi** (D19),
**Login Google** (D21), dan tombol gratis **"Cek di situs kurir"**; lacak resi otomatis (D20) siap tetapi
nonaktif karena API Binderbyte berbayar.

Yang masih terbuka: LCP seluler halaman detail di simulasi Lighthouse (3,1 s; throttling devtools 2,4 s),
QRIS sandbox (simulator error 2603),
dan uji manusia di produksi (lihat bagian 6).

## 2. Kemajuan per tahap

| Tahap | Keadaan |
|---|---|
| Fondasi | Layout, auth Argon2id + JWT berversi password (sesi lama gugur saat password diganti), penjaga halaman, reset password, pembatas percobaan MySQL — selesai |
| Katalog | Beranda, kategori, saran pencarian, filter (pilihan bisa dicari), sort, pagination, grid/list, detail + galeri — selesai |
| Keranjang & checkout | Empat langkah, buku alamat, ongkir, promo, stok atomik, invoice, Snap sandbox, COD — selesai |
| Akun & admin | Profil/password/alamat/hapus akun, riwayat + timeline, admin CRUD lewat modal, stok, arsip, proses pesanan — selesai |
| Pelengkap | Wishlist, ulasan + foto, promo/banner, metadata, sitemap, bantuan, mode gelap, asisten AI — selesai |
| Lanjutan (D19–D21) | Ongkir per zona 38 provinsi, Login Google (OAuth PKCE), tombol cek resi di situs kurir — online; lacak resi otomatis — kode siap, nonaktif (berbayar) |
| Rilis | Produksi online dan teruji; sisa tindakan pemilik di bagian 6 |

## 3. Verifikasi terbaru (3 Oktober 2026)

| Pemeriksaan | Status | Bukti / batas |
|---|---|---|
| `npm run typecheck` | PASS | Next typegen + TypeScript |
| `npm run lint` (seluruh repo) | PASS | Tanpa error ESLint |
| `npm run test` | PASS | 551 lulus, 2 dilewati (3 Okt malam, termasuk tes ongkir zona, Google, lacak) |
| `npm run test:integration` | PASS | 34 tes MySQL nyata (8 berkas; + penautan akun Google): transaksi, race stok, auth, batas percobaan, settlement |
| `npx prisma validate` | PASS | 15 tabel bisnis + `auth_rate_limits` |
| `npm run build` | PASS | Build production Next.js 16.3.6 |
| `npm run e2e` (Chrome desktop + HP 360 px) | PASS | 88 lulus, 1 dilewati (+ ongkir zona Bali, tautan cek resi JNE): aksesibilitas, navigasi, katalog, akun, admin (modal), transaksi, ulasan, lupa password, asisten, responsif |
| `npm audit --omit=dev` | PASS | 0 kerentanan setelah `shadcn` (alat CLI) dipindah ke devDependencies; advisori `braces` hanya menyentuh alat pengembangan |
| axe (WCAG 2.2 AA) terang + gelap | PASS | 0 pelanggaran serius/kritis di halaman publik, admin, modal, pilihan terbuka, panel asisten |
| Lighthouse produksi seluler (Chrome bersih) | PASS / FAIL | Beranda **98**, LCP 1,7 s · katalog 96, LCP 2,5 s · detail 91, LCP 3,1 s (simulasi; render delay dari streaming). Throttling devtools: katalog 2,5 s, detail 2,4 s. Font judul tidak lagi dipreload: build lokal LCP katalog 2,33 → 2,17 s, detail 2,21 → 2,10 s (median 3 run), CLS 0 |
| Asisten AI di produksi | PASS | Jawaban benar (metode bayar, rekomendasi produk + tautan, ongkir 2,5 kg = Rp 45.000); 16/16 upaya penyalahgunaan ditolak (Gemini dan Groq) |
| Suite lintas browser penuh (Edge, Firefox, WebKit) | NOT_RUN hari ini | Terakhir 1 Okt: 299/310 lalu 28/28 setelah isi ulang stok DB uji; diulang bila ada perubahan lintas browser |
| PPT diperbarui | PASS | 22 slide dari generator `scripts/ppt/` (diperbarui tiap akhir sesi); versi terakhir 3 Okt: angka uji 475/87, LCP katalog 2,3 / detail 2,2 dtk, backup harian, uji bayar produksi; validator PPTX PASS; slide 7, 18, 20, 21 dirender dan diperiksa |

## 4. Layanan online (produksi)

| Layanan | Status | Catatan |
|---|---|---|
| Vercel + Aiven (TLS) | PASS | HTTP 200, `/admin` dialihkan ke masuk, deploy otomatis setiap merge |
| Unggah gambar (Vercel Blob, D15) | PASS | File lama dihapus otomatis saat dilepas/diganti (E2E admin memeriksa berkas hilang; produksi 3 Okt: file Blob 200 → 404 setelah dilepas, foto demo tetap 200); E2E opt-in `unggah-blob.spec.ts`; uji di produksi 3 Okt lewat admin (Chrome, sesi admin pemilik): foto tersimpan di Blob, tampil di halaman publik (HTTP 200, WebP), lalu dihapus lagi dari produk |
| Email (Gmail SMTP) | PASS | Login SMTP + email uji terkirim; email "Lupa password" dari situs produksi diuji pemilik 3 Okt (aman). Email invoice/perubahan status belum diuji dari situs |
| Midtrans sandbox | PASS / FAIL | **Produksi 3 Okt:** pesanan INV-202610-0001 dibayar BCA VA di simulator resmi, webhook mengubah status otomatis menjadi Dikonfirmasi · Lunas tanpa "Cek Pembayaran". Lokal: BCA & Mandiri PASS; QRIS gagal di simulator |
| Cron pesanan | PASS | Workflow `pesanan-otomatis.yml` tiap jam di repo pribadi; run pertama 3 Okt HTTP 200 (0 gagal); cron harian Vercel tetap sebagai cadangan |
| Asisten AI (Gemini + Groq) | PASS | Kunci gratis tanpa kartu; tombol darurat `ASISTEN_NONAKTIF=1` |
| Login Google (D21) | PASS | OAuth Client "TokoKita Web" (project `tokokita-510509`) *In production*; uji akun asli di localhost PASS; produksi: 307 ke Google dengan PKCE/state/nonce, cookie `Secure; HttpOnly`, callback palsu ditolak; migration `google_sub` diterapkan sebelum merge |
| Tombol cek resi kurir | PASS | Admin produksi: "Cek di situs SiCepat"; JNE meminta 5 digit telepon penerima (dicek manual) |
| Lacak resi otomatis (D20) | NOT_RUN | Binderbyte berbayar (Rp 15/hit); kunci tidak dipasang atas keputusan pemilik |
| Backup Aiven | PASS (jadwal) / NOT_RUN (pulih dari backup otomatis) | Backup harian terenkripsi `backup-db.yml`: run pertama 3 Okt, 17 tabel, 26 KB, simpan 30 hari ([backup-restore](runbooks/backup-restore.md)); restore manual 1 Okt PASS |

## 5. Kriteria sukses PRD §22

| Kriteria | Status | Bukti / batas |
|---|---|---|
| Data di MySQL | PASS | E2E dan integrasi tanpa data palsu |
| Pencarian/filter/sort/grid/list/pagination | PASS | E2E katalog (termasuk pilihan yang bisa dicari) |
| Detail/galeri/varian/ulasan | PASS | E2E katalog, transaksi, unggah ulasan |
| Keranjang/jumlah/promo | PASS | Harga dihitung ulang server; unit + E2E |
| Auth/reset/guard | PASS | Unit, integrasi, E2E (keluar dengan konfirmasi) |
| Checkout/ongkir/tanpa overselling | PASS | Race stok terakhir di MySQL; E2E empat langkah |
| Pembatalan otomatis/stok/promo kembali | PASS | Integrasi + latihan demo; cron online tiap jam berjalan (3 Okt) |
| Admin produk/stok/pesanan | PASS | E2E admin lewat modal + transisi status |
| Email perubahan status | NOT_RUN | Kode teruji (loopback); SMTP eksternal terpasang tetapi belum diuji dari situs |
| Riwayat/detail/timeline | PASS | E2E pembeli/admin |
| Performa/SEO/aksesibilitas | PASS (sebagian) | Beranda LCP 1,7 s, katalog 2,5 s, aksesibilitas 0 pelanggaran serius; detail 3,1 s di simulasi seluler (2,4 s throttling devtools) |
| `npm run db:reset` menghasilkan demo lengkap | NOT_RUN | Destruktif, perlu persetujuan; terakhir PASS 27 Sep (PROGRESS) |
| Responsif | PASS | E2E 360 px tanpa gulir mendatar, tombol ≥ 44 px |

## 6. Sisa pekerjaan

**Menunggu pemilik** (langkah rinci di [SERAH_TERIMA](SERAH_TERIMA.md)):
1. Uji manusia di produksi: selesai 3 Okt. Bayar sandbox BCA, unggah/hapus gambar admin, dan penjaga admin diuji Claude lewat sesi yang di-login pemilik; email "Lupa password" diuji pemilik; password akun admin/pembeli demo produksi sudah diganti pemilik; nama Snap "TokoKita".
2. Simpan salinan `.env.otomasi` (kunci pembuka backup) di tempat aman; uji buka satu backup mengikuti runbook.
3. Foto produk asli dan pembersihan data demo sebelum dipakai pelanggan nyata.

**Terbuka di sisi kode:** LCP detail seluler di simulasi Lighthouse > 2,5 s; QRIS sandbox (simulator Midtrans).
