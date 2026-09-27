# Status Proyek — TokoKita

**Repositori:** `https://github.com/Magang-Project-Cmlabs/ecommerce` (private)
**Cabang utama:** `main` (stabil) · `develop` (integrasi)
**Terakhir diperbarui:** 27 September 2026

## 1. Ringkasan

Tahap **1 — Fondasi, berjalan.** Kartu *A1 · Siapkan proyek awal* dan *A1 · Buat database dan isi data contoh* selesai:
Next.js 16.3.6 + Prisma 7.10.0 + Tailwind 4 + shadcn terpasang, semua gerbang
verifikasi lulus. Skema 15 tabel (migration `init`) dan data demo PRD §20 sudah
ada (branch `feat/skema-database`). Belum ada halaman TokoKita maupun auth. Modul **payment gateway Midtrans sandbox** di
`src/lib/payment/` teruji tetapi belum tersambung ke aplikasi (D9).

## 2. Kemajuan per tahap (PRD §6)

| Tahap | Status |
|---|---|
| 1. Fondasi (setup, skema, seed, layout, auth) | Berjalan — setup, skema, seed selesai; layout dan auth belum |
| 2. Katalog | Belum mulai |
| 3. Keranjang & Checkout | Belum mulai |
| 4. Akun & Admin | Belum mulai |
| 5. Pelengkap (wishlist, ulasan, promo & banner admin) | Belum mulai |
| 6. Rilis | Belum mulai |

## 3. Verifikasi terakhir

| Pemeriksaan | Status | Catatan |
|---|---|---|
| `npm run typecheck` | PASS | 27 Sep 2026, setelah `npm ci` bersih |
| `npm run lint` | PASS | 27 Sep 2026 |
| `npm run test` | PASS | 27 Sep 2026, 69/69 unit test modul pembayaran |
| `npm run test:sandbox` | PASS | 27 Sep 2026, bayar BCA VA di Midtrans sandbox → dikonfirmasi |
| `npx prisma validate` | PASS | 27 Sep 2026, skema tanpa model |
| `npm run build` | PASS | 27 Sep 2026 |
| `npm run dev` | PASS | 27 Sep 2026, beranda 200, `lang="id"` |
| `npm run e2e` | NOT_RUN | Harness jalan (40 tes), semua dilewati karena halaman TokoKita belum ada |
| `npm run db:seed` | PASS | 27 Sep 2026: 23 cek aturan PRD §10 = 0 pelanggaran, hasil identik saat diulang |
| `npm run db:reset` | NOT_RUN | Rangkaian lengkap belum dijalankan (menghapus data; butuh persetujuan) |

## 4. Kriteria sukses PRD §22

| Kriteria | Status | Bukti |
|---|---|---|
| Semua data dibaca dan disimpan di MySQL | Sebagian | Skema 15 tabel + seed di MySQL; halaman belum ada |
| `npm run db:reset` menghasilkan data demo lengkap | Belum | `db:seed` terbukti lengkap; rangkaian `db:reset` belum dijalankan |

Kriteria lain belum dimulai. Centang hanya setelah dibuktikan di browser atau
lewat tes.

## 5. Blocker aktif

- Keputusan D1 (versi Next.js) dan D2 (versi Prisma) di
  [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md) perlu dijawab sebelum scaffold;
  D9 (payment gateway) perlu persetujuan A1 dan pembimbing.
