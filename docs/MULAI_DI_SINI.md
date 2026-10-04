# Mulai di Sini — TokoKita

Terakhir diperbarui: **3 Oktober 2026**.

## Keadaan repo

Aplikasi memakai Next.js 16.3.6, Prisma 7.10.0, MySQL, Tailwind 4 dan shadcn.
Katalog, wishlist, ulasan, keranjang, checkout 4 langkah, pesanan, akun,
dan admin lengkap sudah memakai database. Tidak ada fallback pesanan palsu
ketika database gagal. Desain mengikuti [`DESIGN.md`](../DESIGN.md) (gaya Framer, mode terang/gelap,
pilihan dropdown yang bisa dicari, admin dengan modal tambah/ubah). Ongkir per zona provinsi (D19),
Login Google (D21), dan tombol cek resi di situs kurir sudah aktif. Tombol "Tanya AI"
menjawab pertanyaan seputar toko (D18). PPT 25 slide (juga dalam PDF) berisi anggota tim, tangkapan layar terbaru, ERD, dan tautan proyek.

Versi online: https://ecommerce-peach-seven-47.vercel.app (Vercel + Aiven).

Branch integrasi: `develop`. Pekerjaan lanjutan dibuat di `feat/penyelesaian-tokokita`
lalu digabung lewat PR (CI hijau → merge). Lihat [status aktual](PROJECT_STATUS.md) dan [serah terima](SERAH_TERIMA.md).

## Menyalakan lokal

1. Baca [CLAUDE.md](../CLAUDE.md), `.env.example` dan [setup lokal](runbooks/local-setup.md).
2. Jalankan MySQL Laragon, `npm ci`, lalu `npm run db:deploy`.
3. Jika database baru dan kosong membutuhkan contoh, jalankan seed dengan
   sadar bahwa seed menghapus seluruh data. Jangan reset database yang berisi
   pekerjaan atau pesanan tanpa instruksi pemilik.
4. `npm run dev` → `http://localhost:3000`.
5. Opsional: isi `ASISTEN_API_KEY` di `.env` (kunci gratis Google AI Studio) agar tombol
   "Tanya AI" tampil; tanpa kunci aplikasi tetap berjalan normal.

Database memiliki 15 tabel bisnis dan 1 tabel infrastruktur `auth_rate_limits`.
Migration lama tetap utuh. Gambar demo lokal tersedia di `public/demo`.

## Aturan yang perlu dijaga

- Harga, stok, berat, ongkir dan promo dihitung ulang di server.
- Checkout, stok dan log status berada dalam transaksi; pembatalan idempoten.
- Setiap action memeriksa login, kepemilikan dan role; JWT memeriksa versi password.
- Password memakai Argon2id (D17); hash bcrypt lama diganti otomatis saat login.
- Asisten AI hanya membaca data publik toko, tanpa tools/SQL, dibatasi per pengguna/IP (D18).
- Form edit produk memakai versi `updatedAt` agar stok baru tidak tertimpa.
- Varian yang sudah tercatat dalam pesanan tidak boleh dihapus.
- Gambar diunggah satu file/request ≤2 MB; final form memakai token unggah,
  bukan URL pengguna. Production memakai Vercel Blob (D15).
- Next.js 16: baca panduan lokal `node_modules/next/dist/docs/` sebelum perubahan.
- Rahasia, dump DB, foto unggahan dan artifact tes tidak masuk Git.

## Verifikasi dan rilis

`npm run typecheck` → `npm run lint` → `npm run test` →
`npm run test:integration` → `npm run build` → `npm run e2e`.

Integrasi menggunakan database uji terpisah dengan nama mengandung
`verifikasi` atau berakhiran `_test`; tidak memakai/reset database toko.
Playwright memakai akun nyata dari `tests/e2e/.env.e2e` dan browser Chrome.
Jangan menjalankan beberapa runner ke folder artifact yang sama.

Rilis mengikuti [Vercel + Aiven](runbooks/deployment.md), menggantikan VPS
atas keputusan pemilik pada 1 Oktober 2026. Baca [keputusan](OPEN_DECISIONS.md)
untuk rate limit bersama, sesi dan cron. Perbarui `PROJECT_STATUS`,
`PROGRESS` dan `SERAH_TERIMA` dengan hasil `PASS`/`FAIL`/`NOT_RUN`.
