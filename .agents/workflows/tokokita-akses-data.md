---
description: Menulis query, transaksi, skema Prisma, migration, atau seed TokoKita.
---

# Akses Data TokoKita

Versi ringkas. Prosedur lengkap: `.claude/skills/tokokita-akses-data/SKILL.md`.

1. Query baca hanya di `src/lib/data/`; tanpa query di dalam loop.
2. Uang dan berat INT; harga efektif varian `variant.price ?? product.price`.
3. Buat/batal pesanan dalam `prisma.$transaction`; stok dikurangi bersyarat (`updateMany` + cek `count`).
4. Skema hanya lewat `npx prisma migrate dev --name …`; migration lama tidak diedit.
