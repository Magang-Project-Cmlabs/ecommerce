# Mulai di Sini — TokoKita

> Ringkasan satu halaman untuk anggota tim dan AI agent sebelum mulai kerja.
> Terakhir diperbarui: **27 September 2026**

## 1. Keadaan repo hari ini

| Komponen | Fakta |
|---|---|
| Kode aplikasi | **Scaffold selesai** (Next.js 16.3.6, Prisma 7.10.0, Tailwind 4, shadcn Radix/Nova). Skema 15 tabel dan data demo sudah ada; halaman TokoKita belum. Modul payment gateway Midtrans sandbox ada di `src/lib/payment/`. |
| Git | `github.com/Magang-Project-Cmlabs/ecommerce` (private), branch `main` dan `develop`. |
| Isi repo | Dokumen perencanaan (`docs/`), instruksi AI (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.agents/`), template (`.env.example`, `.gitignore`, template PR), kerangka tes E2E (`tests/e2e/`). |
| Stack | Next.js App Router + TypeScript, Prisma, MySQL, Tailwind, shadcn/ui (PRD §5). |
| Lingkungan lokal | Laragon: Node 24, MySQL 8 di `C:\laragon\bin\mysql`. |
| Jadwal | 1 minggu, Hari 0–6 (lihat `trello-board-plan.md`). |

## 2. Urutan Hari 1 (Blocker)

Tiga kartu ini harus selesai duluan karena anggota lain bergantung padanya:

1. ~~**A1 · Siapkan proyek awal**~~ — selesai 27 Sep 2026 (branch
   `chore/scaffold-nextjs`). Anggota tinggal mengikuti
   [`runbooks/local-setup.md`](runbooks/local-setup.md) bagian B.
2. ~~**A1 · Buat database dan isi data contoh**~~ — selesai 27 Sep 2026 (Kevin
   Ilham): 15 tabel, migration `init`, seed PRD §20. Jalankan `npm run db:reset`
   untuk mengisi database lokal.
3. **A4 · Aturan cek isian form** — skema Zod bersama di `src/lib/validations/`.

Sambil menunggu, A2 dan A3 bisa mengerjakan tampilan yang belum butuh data.

## 3. Aturan keras (ringkas)

Lengkapnya di [`../CLAUDE.md`](../CLAUDE.md#aturan-keras).

- Harga, stok, ongkir, dan diskon **selalu dihitung di server** dari database.
- Uang = INT rupiah, berat = INT gram.
- Stok dikurangi **di dalam transaksi, bersyarat** — tidak boleh overselling.
- Database hanya diakses di `src/lib/data/` dan server actions.
- Setiap aksi mengecek login, pemilik data, dan role admin di server.
- Skema hanya berubah lewat migration Prisma.
- `.env` tidak pernah di-commit.

## 4. Jebakan yang sudah diketahui

- **Next.js 16 dan Prisma 7 berbeda dari tutorial lama.** Middleware kini
  `src/proxy.ts`; tipe `LayoutProps`/`PageProps` dibuat `next typegen`; Prisma
  memakai `prisma7.config.ts`, client dari `@/generated/prisma/client`, dan
  adapter MariaDB. Baca `node_modules/next/dist/docs/` dan runbook
  `database-operations.md` sebelum menyalin contoh dari internet.
- **Seed tidak jalan otomatis** setelah `migrate reset`/`migrate dev` di Prisma 7;
  pakai `npm run db:reset` (sudah merangkai reset → generate → seed).
- **Varian vs produk:** produk dengan varian memakai `product_variants.stock`;
  `products.stock` hanya total untuk tampilan (PRD §10.1).
- **Keranjang ada di localStorage**, jadi isinya bisa basi. Checkout wajib
  memvalidasi ulang harga dan stok (PRD §7.5).

## 5. Setelah selesai mengerjakan kartu

1. Jalankan pemeriksaan di [`UJI_MANDIRI.md`](UJI_MANDIRI.md).
2. Buka PR sesuai [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
3. Catat di [`PROGRESS.md`](PROGRESS.md) dan perbarui [`PROJECT_STATUS.md`](PROJECT_STATUS.md).
