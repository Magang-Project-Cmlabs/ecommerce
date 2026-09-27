# Status Proyek — TokoKita

**Repositori:** `https://github.com/Magang-Project-Cmlabs/ecommerce` (private)
**Cabang utama:** `main` (stabil) · `develop` (integrasi)
**Terakhir diperbarui:** 27 September 2026

## 1. Ringkasan

Tahap **1 — Fondasi, berjalan.** Kartu *A1 · Siapkan proyek awal* selesai:
Next.js 16.3.6 + Prisma 7.10.0 + Tailwind 4 + shadcn terpasang, semua gerbang
verifikasi lulus (branch `chore/scaffold-nextjs`). Belum ada model database,
halaman TokoKita, maupun auth. Modul **payment gateway Midtrans sandbox** di
`src/lib/payment/` teruji tetapi belum tersambung ke aplikasi (D9).

## 2. Kemajuan per tahap (PRD §6)

| Tahap | Status |
|---|---|
| 1. Fondasi (setup, skema, seed, layout, auth) | Berjalan — setup selesai; skema, seed, layout, auth belum |
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
| `npm run db:reset` | NOT_RUN | Skema dan seed belum ada |

## 4. Kriteria sukses PRD §22

Belum ada yang terpenuhi. Centang di sini hanya setelah dibuktikan di browser
atau lewat tes.

## 5. Blocker aktif

- Keputusan D1 (versi Next.js) dan D2 (versi Prisma) di
  [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md) perlu dijawab sebelum scaffold;
  D9 (payment gateway) perlu persetujuan A1 dan pembimbing.
