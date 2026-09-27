---
name: tokokita-akses-data
description: Pola akses database TokoKita dengan Prisma ke MySQL - data layer di src/lib/data, mencegah query N+1, transaksi, pengurangan stok bersyarat, uang INT, snapshot pesanan, dan arsip produk. Pakai saat menulis query, server action yang mengubah data, schema.prisma, migration, atau seed.
---

# Akses Data TokoKita

## 1. Satu pintu

- Query baca hanya di `src/lib/data/*.ts`. Tambahkan `import "server-only"` di
  atas berkasnya supaya tidak bisa terimpor ke komponen client.
- Klien Prisma tunggal di `src/lib/db.ts` (pola singleton `globalThis` agar hot
  reload tidak membuka koneksi berulang). Prisma 7: import dari
  `@/generated/prisma/client` dan wajib adapter `PrismaMariaDb`
  (`@prisma/adapter-mariadb`) — lihat skill `prisma-database-setup`.
- Halaman memanggil fungsi data, bukan `prisma.*` langsung.
- Fungsi data mengembalikan bentuk yang dibutuhkan UI lewat `select`, bukan
  seluruh baris — terutama jangan pernah mengirim `password_hash` ke client.

## 2. Tanpa N+1

Jangan memanggil Prisma di dalam `for`/`map`. Ambil sekaligus:

```ts
// Buruk: 1 query per item keranjang
for (const item of items) await prisma.product.findUnique({ where: { id: item.productId } });

// Baik: 1 query
const products = await prisma.product.findMany({
  where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  select: { id: true, name: true, price: true, weight: true, stock: true,
            variants: { select: { id: true, name: true, price: true, weight: true, stock: true } } },
});
const byId = new Map(products.map((p) => [p.id, p]));
```

Daftar dengan relasi memakai `include`/`select` bersarang. Hitungan (mis. jumlah
ulasan) memakai `_count` atau kolom tersimpan (`review_count`).

## 3. Uang dan berat

- `Int` untuk semua kolom rupiah dan gram. Tidak ada `Float`/`Decimal`.
- Harga efektif varian: `variant.price ?? product.price`; berat:
  `variant.weight ?? product.weight` (PRD §9).
- Pembulatan persen diskon: `Math.floor`, lalu batasi `max_discount`.

## 4. Transaksi dan stok

Semua langkah buat/batal pesanan dalam satu `prisma.$transaction(async (tx) => …)`.
Kurangi stok **bersyarat**, jangan baca-lalu-tulis:

```ts
const res = await tx.productVariant.updateMany({
  where: { id: variantId, stock: { gte: qty } },
  data: { stock: { decrement: qty } },
});
if (res.count !== 1) throw new StokTidakCukupError(variantId);
```

- Produk bervarian: setelah stok varian berubah, hitung ulang
  `products.stock = SUM(variant.stock)` di transaksi yang sama.
- Pre-order boleh melewati syarat stok (PRD §10.1).
- Pembatalan: `increment` stok, kurangi `sold_count`, hapus/tandai
  `promo_usages`, kurangi `used_count` — semuanya dalam satu transaksi.
- Error di dalam callback otomatis me-rollback; jangan menangkapnya di dalam lalu
  melanjutkan.

## 5. Snapshot pesanan

`order_items` menyimpan `name`, `variant_name`, `image`, `price`, `weight` saat
itu; `orders.shipping_address` menyimpan salinan JSON alamat. Halaman riwayat
pesanan membaca snapshot, **bukan** produk terkini.

## 6. Arsip, bukan hapus

- Produk: `is_active = false`. Semua query katalog wajib `where: { isActive: true }`.
- Akun dihapus: anonimkan data pribadi, isi `deleted_at`, pesanan tetap.

## 7. Skema dan migration

- Nama model/kolom mengikuti PRD §9. Pakai `@map`/`@@map` bila model Prisma
  memakai camelCase sedangkan tabel snake_case — pilih satu konvensi di migration
  pertama dan jangan dicampur.
- Indeks wajib PRD §9: `products.category_id`, `brand`, `price`;
  `orders.user_id`, `status`, `payment_due_at`. Unique: `reviews.order_item_id`,
  `wishlist_items(user_id, product_id)`, `orders.order_number`.
- Enum PRD (`role`, `status`, `payment_status`, promo `type`) memakai `enum`
  Prisma, nilainya persis seperti PRD.
- Perubahan skema lewat `npx prisma migrate dev --name …`; migration lama tidak
  diedit. Prosedur: `docs/runbooks/database-operations.md`.

## 8. Keamanan query

- Hanya Prisma API. `$queryRaw` dengan tagged template bila terpaksa;
  `$queryRawUnsafe` dilarang.
- Data milik pembeli selalu difilter `userId` dari sesi:
  `where: { id: orderId, userId: session.userId }`.
