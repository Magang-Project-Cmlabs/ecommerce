---
name: tokokita-konteks
description: Orientasi proyek TokoKita (toko online Next.js App Router + Prisma + MySQL) - stack, peta folder, 15 tabel, peran pengguna, pembagian tim A1-A5, dan dokumen rujukan. Pakai di awal setiap sesi kerja di repo ini atau saat belum yakin di mana sebuah kode harus diletakkan.
---

# Orientasi TokoKita

Jalankan sebelum membaca atau mengubah kode.

## 1. Cek keadaan nyata dulu

Dokumen bisa tertinggal dari kode. Pastikan:

```bash
ls package.json prisma/schema.prisma src 2>/dev/null   # sudah di-scaffold?
git status && git branch --show-current               # branch dan perubahan
```

Belum ada `package.json` → proyek belum di-scaffold; rujuk
`docs/runbooks/local-setup.md` bagian A. Jangan menulis kode aplikasi di luar
kartu A1 · Hari 1 sebelum scaffold selesai.

Baca `docs/PROJECT_STATUS.md` dan `docs/SERAH_TERIMA.md` untuk tahu apa yang
sudah jadi dan apa yang sedang dikerjakan orang lain.

## 2. Arsitektur

| Aspek | Keputusan | Sumber |
|---|---|---|
| Framework | Next.js App Router + TypeScript | PRD §4 |
| Baca data | Server Components memanggil fungsi di `src/lib/data/` | PRD §12 |
| Ubah data | Server Actions di `src/actions/` | PRD §12 |
| Route handler | hanya `api/search` dan `api/cron/orders` | PRD §12 |
| ORM | Prisma ke MySQL | PRD §5 |
| Sesi | JWT di cookie httpOnly; `proxy.ts` mengalihkan, server mengecek ulang | PRD §12-13 |
| Keranjang | Zustand + localStorage, divalidasi ulang di checkout | PRD §7.5, §10.8 |

## 3. Di mana kode diletakkan

| Kamu menulis… | Letakkan di |
|---|---|
| Query baca (produk, kategori, pesanan) | `src/lib/data/<domain>.ts` |
| Aksi ubah data | `src/actions/<domain>.ts` (`"use server"`) |
| Skema Zod | `src/lib/validations/<domain>.ts` — dipakai form **dan** action |
| Hitungan murni (ongkir, promo, transisi status) | `src/lib/<domain>.ts`, tanpa Prisma, mudah di-unit-test |
| Label, tarif kurir, batas angka | `src/lib/constants.ts` |
| Format Rp dan tanggal | `src/lib/format.ts` |
| Komponen shadcn | `src/components/ui/` (hasil `npx shadcn add`) |
| Komponen fitur | `src/components/{layout,product,cart,checkout,admin}/` |

## 4. Tabel (PRD §9)

Pengguna: `users`, `addresses`, `password_reset_tokens` ·
Katalog: `categories`, `products`, `product_images`, `product_variants`,
`reviews`, `wishlist_items` · Transaksi: `orders`, `order_items`,
`order_status_logs`, `promo_codes`, `promo_usages` · Konten: `banners`.

## 5. Peran tim (Trello)

A1 `kvnlhm` database & login, penggabung PR · A2 `azridalimunthe7` **ketua tim**
& tampilan katalog · A3 `rizkikusnadi03` keranjang, checkout & akun · A4
`astroceilo` logika pesanan · A5 `fikarnugraha18` admin & pengujian. Rincian:
`docs/trello-board-plan.md`. Mengubah area anggota lain?
Sebutkan di PR dan minta dia jadi salah satu reviewer.

## 6. Rujukan

- `CLAUDE.md` — aturan keras
- `docs/PRD - E-Commerce.md` — aturan bisnis lengkap
- `docs/GLOSSARY.md` — nama konsep di kode dan label UI
- `docs/OPEN_DECISIONS.md` — jangan menebak hal yang tercatat di sini
