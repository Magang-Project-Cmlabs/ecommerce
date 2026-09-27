# TokoKita — instruksi proyek

Toko online mandiri (katalog, keranjang, checkout 4 langkah, akun, panel admin)
untuk proyek magang tim 5 orang. Sumber kebenaran produk:
[`docs/PRD - E-Commerce.md`](docs/PRD%20-%20E-Commerce.md). Kalau berkas ini dan PRD
bentrok, PRD yang menang; catat bentroknya di `docs/OPEN_DECISIONS.md`.

Sebelum kerja: baca [`docs/MULAI_DI_SINI.md`](docs/MULAI_DI_SINI.md) lalu
[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md). Skill orientasi: `tokokita-konteks`.

## Stack (terkunci oleh PRD §4-5)

Next.js App Router + React + TypeScript · MySQL 8 / MariaDB 10.4+ · Prisma ·
Tailwind CSS · shadcn/ui · Lucide · Framer Motion · Zustand (keranjang di
localStorage) · React Hook Form + Zod · bcrypt + JWT di cookie httpOnly ·
Nodemailer · penyimpanan gambar lokal (dev) / S3-compatible (prod) · date-fns `id` ·
Vitest (unit test) · Midtrans Snap sandbox lewat `fetch` (tanpa SDK, D9).

Versi terkunci: Next.js 16.3.6, React 19.2, Prisma 7.10.0 (CLI, client, dan
`@prisma/adapter-mariadb` harus sama persis), Tailwind 4, shadcn (base Radix,
preset Nova). **Next.js 16 dan Prisma 7 punya breaking changes** dibanding
pengetahuan umum: sebelum menulis kode Next.js baca panduan di
`node_modules/next/dist/docs/` (blok aturan di `AGENTS.md`), dan untuk Prisma
pakai skill `prisma-cli`, `prisma-client-api`, `prisma-database-setup`.

Jangan menambah ORM, library UI, state manager, atau library auth lain. Butuh
sesuatu di luar daftar ini? Tulis dulu di `docs/OPEN_DECISIONS.md`.

## Struktur target (PRD §12)

```
prisma/        schema.prisma, migrations/, seed.ts
src/app/       halaman pembeli, admin, route handler (api/search, api/cron/orders)
src/actions/   server actions — SATU-SATUNYA jalur mutasi data
src/components/ ui (shadcn), layout, product, cart, checkout, admin
src/lib/       db, auth, data/, validations/, email, storage, format, constants
src/stores/    cart-store (Zustand)
src/proxy.ts   redirect belum login -> /masuk?next=...
tests/e2e/     Playwright (lihat tests/e2e/README.md)
```

## Perintah

Sudah di-scaffold (27 Sep 2026; catatan di
[`docs/runbooks/local-setup.md`](docs/runbooks/local-setup.md)). Skrip:
`dev` `build` `start` `lint` `typecheck` (= `next typegen` + `tsc`) `test`
`test:sandbox` `db:generate` `db:migrate` `db:seed` `db:reset` `db:studio`
`e2e` `e2e:report`. Skema 15 tabel + seed data demo sudah ada; klien Prisma
bersama di `src/lib/db.ts`. `db:reset` menghapus data — minta persetujuan
user dulu. Jangan menulis perintah yang tidak dijalankan sebagai PASS.

## Aturan keras

1. **Harga dari server.** Harga, berat, stok, ongkir, dan diskon selalu dihitung
   ulang dari database. Angka dari client hanya dipakai sebagai id + jumlah.
2. **Uang dan berat adalah INT.** Rupiah tanpa desimal, berat dalam gram. Tidak
   ada `float`/`Decimal` untuk uang. Tampilan lewat `src/lib/format`.
3. **Stok tanpa overselling.** Buat dan batalkan pesanan di dalam
   `prisma.$transaction`. Kurangi stok bersyarat (`updateMany` dengan
   `stock: { gte: qty }`, lalu cek `count === 1`). Pembatalan mengembalikan stok
   dan kuota promo. Detail: skill `tokokita-pesanan`.
4. **Akses DB hanya di `src/lib/data/`** (dan transaksi di `src/actions/`).
   Berkas `"use client"` tidak pernah mengimpor Prisma. Hindari query di dalam
   loop — pakai `include`/`select`/`in`.
5. **Mutasi hanya lewat Server Actions.** Route handler hanya
   `GET /api/search`, `GET /api/cron/orders` (dijaga `CRON_SECRET`), dan
   webhook `POST /api/payment/midtrans` (dijaga signature, usulan
   `docs/OPEN_DECISIONS.md` D9).
6. **Validasi Zod di server** untuk setiap input, skema di `src/lib/validations/`
   dipakai bersama oleh form dan action.
7. **Authz di setiap aksi.** Cek sesi, kepemilikan (`userId`), dan role `admin`
   di server lewat `requireUser(path)` / `requireAdmin(path)`
   (`src/lib/auth/akses.ts`) — di baris awal setiap `page.tsx` di `/checkout`,
   `/akun`, `/wishlist`, `/admin` (dijaga test `penjaga-halaman.test.ts`) dan
   di setiap Server Action. `proxy.ts` hanya pengalih optimistis, bukan pelindung;
   cek di layout tidak cukup.
8. **Status pesanan hanya lewat satu fungsi transisi** yang menegakkan tabel
   PRD §10.6 dan menulis `order_status_logs` di transaksi yang sama.
9. **Skema hanya lewat migration Prisma.** Migration yang sudah masuk `develop`
   tidak diedit; perbaikan = migration baru. Produk diarsipkan
   (`is_active = false`), tidak dihapus.
10. **Rahasia hanya di `.env`** (diabaikan Git). `.env.example` berisi placeholder.
    Password bcrypt, token reset disimpan sebagai hash.
11. **Bahasa & format.** UI Bahasa Indonesia; label status, mata uang
    (`Rp 89.000`), dan tanggal (`23 Sep 2026, 14.30 WIB`) dari satu sumber —
    lihat [`docs/GLOSSARY.md`](docs/GLOSSARY.md).

## Alur kerja tim

- Branch fitur dari `develop` (`feat/…`, `fix/…`), commit kecil
  `<type>: <deskripsi>`, PR ke `develop` dengan tangkapan layar, **2 reviewer**
  (ketua tim + satu anggota). `develop` → `main` di akhir tiap tahap.
  Detail: [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Kartu Trello: [`docs/trello-board-plan.md`](docs/trello-board-plan.md). Kerjakan
  sesuai kartu; fitur di luar kartu masuk Lanjutan, bukan diselipkan.
- Setelah pekerjaan selesai: perbarui `docs/PROJECT_STATUS.md` + `docs/PROGRESS.md`
  (skill `tokokita-perbarui-status`).

## Verifikasi

Status hanya `PASS`, `FAIL`, atau `NOT_RUN` (dengan alasan). Gerbang sebelum PR:
`typecheck` → `lint` → `test` → `build` → `e2e` untuk perubahan yang terlihat
user. Prosedur: skill `tokokita-verifikasi`, [`docs/UJI_MANDIRI.md`](docs/UJI_MANDIRI.md).

## Rute skill & agent proyek

| Pekerjaan | Pakai |
|---|---|
| Orientasi awal sesi | skill `tokokita-konteks` |
| Skema Prisma, migration, seed, indeks | agent `database-agent`, skill `tokokita-akses-data` |
| Server action, data layer, auth, email, cron | agent `backend-engineer` |
| Stok, promo, ongkir, status pesanan | skill `tokokita-pesanan` (TDD wajib) |
| Payment gateway (Midtrans sandbox) | `src/lib/payment/`, [`docs/runbooks/payment-midtrans.md`](docs/runbooks/payment-midtrans.md) |
| Halaman & komponen | skill `tokokita-ui`, agent `frontend-shadcn` |
| Bukti jalan & gerbang rilis | agent `qa-engineer`, skill `tokokita-verifikasi` |
| Auth, upload, data pribadi, cron | agent `security-reviewer` |
| Perbaikan bug/audit sampai PR | skill `perbaikan-terverifikasi` |
| Review & gabungkan PR anggota | skill `tokokita-review-pr` |
