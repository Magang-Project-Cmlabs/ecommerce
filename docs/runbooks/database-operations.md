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

`db:reset` hanya untuk database lokal. Seed wajib menghasilkan isi PRD §20
(1 admin, 1 pembeli demo dengan 2 alamat dan 10-15 pesanan di semua status,
6 kategori + sub, 20-30 produk bervarian, 3-12 ulasan per produk, 3 promo,
3 banner). Seed harus bisa dijalankan berulang tanpa error.

## Melihat data

```bash
npm run db:studio   # Prisma Studio di browser
```

Atau HeidiSQL dari Laragon.

## Production

- Migration saat rilis: `npx prisma migrate deploy` (bukan `migrate dev`,
  bukan `reset`).
- Jangan menjalankan seed demo di production. Buat akun admin sendiri dengan
  password baru; akun demo PRD §20 tidak boleh ada di server.

## Backup & restore (PRD §16)

```bash
# backup (di server, dijalankan cron harian)
mysqldump --single-transaction --routines -u <user> -p ecommerce | gzip > ecommerce-$(date +%F).sql.gz

# restore (uji ke database terpisah, bukan database live)
gunzip -c ecommerce-2026-09-25.sql.gz | mysql -u <user> -p ecommerce_restore_test
```

- Simpan harian 7 hari, mingguan 4 minggu, salin ke storage terpisah.
- Uji restore sebulan sekali; catat hasilnya di `PROGRESS.md`.
- Berkas dump berisi data pribadi pembeli: jangan di-commit (`*.sql` sudah
  diabaikan `.gitignore`), jangan dikirim lewat chat.
