# Runbook — Operasi Database

MySQL 8 / MariaDB 10.4+, charset `utf8mb4_unicode_ci`, diakses lewat **Prisma 7.10.0**.

Yang berbeda dari panduan Prisma lama di internet:

| Hal | Di repo ini |
|---|---|
| Konfigurasi | `prisma7.config.ts` (URL database dari `.env` lewat `dotenv`), bukan `url` di `schema.prisma` |
| Generator | `provider = "prisma-client"`, output `src/generated/prisma/` (diabaikan Git) |
| Import client | `import { PrismaClient } from "@/generated/prisma/client"` |
| Koneksi MySQL | wajib driver adapter `PrismaMariaDb` dari `@prisma/adapter-mariadb` |
| Generate | tidak otomatis setelah migrate; jalankan `npm run db:generate` (juga jalan saat `npm install`) |
| Seed | diatur di `prisma7.config.ts` → `migrations.seed` (mis. `tsx prisma/seed.ts`; runner `tsx` dipasang saat kartu seed). `migrate reset`/`migrate dev` **tidak lagi menjalankan seed otomatis** — karena itu `npm run db:reset` merangkai reset → generate → seed |
| `migrate reset` oleh AI agent | diblokir Prisma sampai user memberi persetujuan eksplisit |
| Collation | `migrate reset` membuat ulang database dengan bawaan server (MySQL 8: `utf8mb4_0900_ai_ci`); migration `kolasi_database` mengembalikannya ke `utf8mb4_unicode_ci` |

Rujukan cepat: skill `prisma-cli`, `prisma-client-api`, `prisma-database-setup`.

## Mengubah skema

1. Pastikan branch-mu sudah memuat `develop` terbaru (`git pull origin develop`).
2. Ubah `prisma/schema.prisma`.
3. Buat migration:
   ```bash
   npx prisma migrate dev --name tambah_kolom_x
   ```
4. Commit `schema.prisma` **dan** folder `prisma/migrations/<timestamp>_…` bersamaan.

Aturan:
- Migration yang sudah masuk `develop` **tidak diedit**. Salah? Buat migration baru.
- Dua orang mengubah skema bersamaan → koordinasi dengan A1; migration dengan
  urutan waktu bentrok harus dibuat ulang oleh yang merge belakangan.
- Uang `Int` (rupiah), berat `Int` (gram). Tambahkan indeks PRD §9 lewat
  `@@index`.
- Tabel bersifat riwayat (`orders`, `order_items`, `order_status_logs`,
  `promo_usages`) tidak pernah dihapus barisnya dari kode aplikasi.

## Seed dan reset

```bash
npm run db:seed     # isi data demo ke database yang ada
npm run db:reset    # HAPUS semua data, jalankan ulang migration + seed
```

`db:reset` hanya untuk database lokal. `prisma/seed.ts` menolak berjalan bila
`NODE_ENV=production`. Seed menghapus lalu mengisi ulang semua data dengan hasil
yang sama setiap kali (acak deterministik). Ini tetap operasi destruktif:
jangan mengulang pada database berisi data toko atau pesanan baru.

Isi seed (PRD §20):

| Data | Isi |
|---|---|
| Akun | `admin@tokokita.id` / `admin12345` (admin), `demo@tokokita.id` / `password123` (pembeli, 2 alamat Jakarta & Bandung), plus 12 pembeli contoh `pembeli1..12@example.com` / `password123` |
| Katalog | 6 kategori × 2–3 sub (15 sub), 26 produk: 14 bervarian, 9 diskon, 2 habis, 2 pre-order; 3 gambar per produk (placeholder `picsum.photos`) |
| Pesanan | 79 pesanan. Akun demo punya 12 di semua status: 1 pending masih bisa dibayar, 1 pending lewat batas bayar (demo batal otomatis), 1 shipped > 7 hari (demo selesai otomatis), COD, promo, batal oleh pembeli, batal admin + refund |
| Ulasan | 188 ulasan, 3–12 per produk, semuanya dari item pesanan `delivered` milik pengulas (Pembeli Terverifikasi) — karena itu ada 12 pembeli contoh |
| Lainnya | 3 promo PRD §10.4 (aktif 30 hari lalu s.d. 90 hari lagi), 3 banner, 4 wishlist akun demo |

Angka pesanan (subtotal, ongkir per kg, diskon, nomor `INV-YYYYMM-0001`, jejak
status) mengikuti PRD §10. Fungsi hitung resmi di `src/lib/` (kartu A4) harus
menghasilkan angka yang sama dengan `hitungOngkir`/`hitungDiskon` di seed.

## Melihat data

```bash
npm run db:studio   # Prisma Studio di browser
```

Atau HeidiSQL dari Laragon.

## Production

- Migration Aiven saat rilis: `npm run db:deploy` (bukan `migrate dev`,
  bukan `reset`).
- Jangan menjalankan seed demo di production. Buat akun admin sendiri dengan
  password baru; akun demo PRD §20 tidak boleh ada di server.

Target rilis Vercel + Aiven mengikuti [`deployment.md`](deployment.md).
`DATABASE_CA_CERT` wajib memakai CA yang benar, dengan verifikasi sertifikat
aktif. Wrapper `db:deploy` memasang CA sementara bagi engine Prisma Migrate;
adapter aplikasi membacanya dari environment. Tidak ada reset saat deploy.

Per 1 Oktober 2026 ada 15 tabel bisnis dan tabel infrastruktur
`auth_rate_limits`. Tiga migration diterapkan pada database lokal dan Aiven.
Tes mutasi dijalankan di database verifikasi terpisah. Foto demo kini dapat
dibaca dari `public/demo/`; `npm run demo:images` memperbarui URL foto seed
tanpa mengubah stok, akun atau status pesanan.

## Backup & restore (PRD §16)

```bash
# backup (di server, dijalankan cron harian)
mysqldump --single-transaction --routines -u <user> -p ecommerce | gzip > ecommerce-$(date +%F).sql.gz

# restore (uji ke database terpisah, bukan database live)
gunzip -c ecommerce-2026-09-25.sql.gz | mysql -u <user> -p ecommerce_restore_test
```

- Sesuaikan backup terkelola dengan paket Aiven; jika belum mencakup retensi
  PRD, gunakan dump TLS terjadwal ke storage terpisah. Jangan menganggap paket
  gratis menyediakan backup sebelum memeriksa dashboard.
- Simpan harian 7 hari, mingguan 4 minggu, salin ke storage terpisah.
- Uji restore sebulan sekali; catat hasilnya di `PROGRESS.md`.
- Berkas dump berisi data pribadi pembeli: jangan di-commit (`*.sql` sudah
  diabaikan `.gitignore`), jangan dikirim lewat chat.
