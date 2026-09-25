# Mulai di Sini — TokoKita

> Ringkasan satu halaman untuk anggota tim dan AI agent sebelum mulai kerja.
> Terakhir diperbarui: **25 September 2026**

## 1. Keadaan repo hari ini

| Komponen | Fakta |
|---|---|
| Kode aplikasi | **Belum ada.** Belum di-scaffold, belum ada `package.json`. |
| Git | `github.com/Magang-Project-Cmlabs/ecommerce` (private), branch `main` dan `develop`. |
| Isi repo | Dokumen perencanaan (`docs/`), instruksi AI (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.agents/`), template (`.env.example`, `.gitignore`, template PR), kerangka tes E2E (`tests/e2e/`). |
| Stack | Next.js App Router + TypeScript, Prisma, MySQL, Tailwind, shadcn/ui (PRD §5). |
| Lingkungan lokal | Laragon: Node 24, MySQL 8 di `C:\laragon\bin\mysql`. |
| Jadwal | 1 minggu, Hari 0–6 (lihat `trello-board-plan.md`). |

## 2. Urutan Hari 1 (Blocker)

Tiga kartu ini harus selesai duluan karena anggota lain bergantung padanya:

1. **A1 · Siapkan proyek awal** — scaffold Next.js di branch sendiri, PR ke
   `develop`. Caranya: [`runbooks/local-setup.md`](runbooks/local-setup.md).
2. **A1 · Buat database dan isi data contoh** — `schema.prisma` untuk 15 tabel
   PRD §9, migration pertama, `seed.ts` sesuai PRD §20.
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

- **`create-next-app` menolak folder yang tidak kosong.** Scaffold ke folder
  sementara lalu pindahkan isinya — lihat runbook local-setup.
- **PRD memakai `proxy.ts`**, nama berkas untuk Next.js 16. Di Next.js 15
  namanya `middleware.ts`. Pastikan versi Next yang terpasang (OPEN_DECISIONS D1).
- **Varian vs produk:** produk dengan varian memakai `product_variants.stock`;
  `products.stock` hanya total untuk tampilan (PRD §10.1).
- **Keranjang ada di localStorage**, jadi isinya bisa basi. Checkout wajib
  memvalidasi ulang harga dan stok (PRD §7.5).

## 5. Setelah selesai mengerjakan kartu

1. Jalankan pemeriksaan di [`UJI_MANDIRI.md`](UJI_MANDIRI.md).
2. Buka PR sesuai [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
3. Catat di [`PROGRESS.md`](PROGRESS.md) dan perbarui [`PROJECT_STATUS.md`](PROJECT_STATUS.md).
