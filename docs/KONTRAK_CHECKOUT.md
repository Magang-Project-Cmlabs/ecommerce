# Kontrak Data Checkout & Pesanan — TokoKita

Kesepakatan bentuk data antara **UI keranjang/checkout (A3)** dan **logika
pesanan (A4)**, agar nama field tidak berbeda saat integrasi. Sumber: PRD §7.5,
§7.6, §10.1–10.5, `prisma/schema.prisma`, [`GLOSSARY.md`](GLOSSARY.md), dan aturan
keras `CLAUDE.md`. Bila berbeda dengan PRD, PRD yang benar.

**Status:** **berlaku sejak 30 Sep 2026.** A3 dan A4 memakai nama field dan
batas di sini apa adanya. Nilai yang tidak diatur PRD ditandai *(D13)* dan
diputuskan di [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md) bagian *Sudah diputuskan*.
Perubahan kontrak harus lewat PR yang mengubah berkas ini, tidak diubah diam-diam
di kode.

| Bagian | Berkas | Pemilik |
|---|---|---|
| Skema Zod (dipakai form dan action) | `src/lib/validations/checkout.ts`, `src/lib/validations/alamat.ts` | A4 |
| Hitungan murni (ongkir, promo, total), TDD | `src/lib/` (lihat skill `tokokita-pesanan`) | A4 |
| Server Action | `src/actions/checkout.ts`, `src/actions/alamat.ts` | A4 |
| Keranjang di localStorage | `src/stores/cart-store.ts` | A3 |
| Halaman `/checkout` dan halaman sukses | `src/app/checkout/…` | A3 |

## 1. Prinsip

1. **Client hanya mengirim id dan jumlah.** Harga, berat, stok, subtotal, ongkir,
   diskon, total, `userId`, status, dan nomor pesanan **tidak pernah** menjadi
   input. Semuanya dihitung ulang di server dari database.
2. `userId` selalu dari sesi (`requireUser`). Alamat dicek kepemilikannya
   (`where: { id, userId }`).
3. Uang = `number` bulat rupiah, berat = `number` bulat gram. Tampilan lewat
   `src/lib/format`.
4. Nilai enum sama persis dengan `schema.prisma`. Label UI diambil dari GLOSSARY.
5. Angka dari pratinjau (§4) hanya untuk tampilan. `buatPesanan` (§5) menghitung
   dan memvalidasi ulang semuanya di dalam transaksi.

## 2. Item keranjang (localStorage)

```ts
type ItemKeranjang = {
  productId: number;
  variantId: number | null; // wajib terisi untuk produk bervarian (PRD §10.1)
  quantity: number;         // bulat, 1–99 (D13)
  // Tampilan saja — tidak pernah dikirim ke server sebagai angka yang dipercaya:
  slug: string;
  name: string;
  variantName: string | null;
  image: string | null;
  price: number;            // harga saat dimasukkan; dibandingkan dengan pratinjau untuk peringatan "harga berubah"
};
```

Kunci unik baris: pasangan `(productId, variantId)`. Menambah barang yang sama
menambah `quantity`, tidak membuat baris baru.

## 3. Alamat baru (langkah 1: "tambah baru")

Disimpan lewat action terpisah, lalu checkout hanya memakai `addressId` *(D13)*.
Skema yang sama dipakai buku alamat di `/akun`.

`simpanAlamat(input: AlamatInput)` → `{ ok: true; addressId: number } | { ok: false; errors?; message? }`

| Field | Tipe | Aturan (mengikuti kolom `addresses`) |
|---|---|---|
| `label` | string | wajib, trim, 1–50 ("Rumah", "Kantor") |
| `name` | string | wajib, trim, 2–100 (nama penerima) |
| `phone` | string | wajib, buang spasi/strip, `^(\+62\|62\|0)8\d{7,12}$` (sama dengan `daftarSchema`), ≤ 20 |
| `street` | string | wajib, trim, 5–255 |
| `district` | string | wajib, trim, 1–100 (kecamatan) |
| `city` | string | wajib, trim, 1–100 (dipakai syarat GoSend) |
| `province` | string | wajib, trim, 1–100 |
| `postalCode` | string | wajib, `^\d{5}$` |
| `isDefault` | boolean | opsional, bawaan `false` |

## 4. Pratinjau (keranjang dan langkah 1–4)

Satu action baca-saja agar drawer keranjang dan tiap langkah checkout memakai
hitungan yang sama dengan `buatPesanan`.

`pratinjauCheckout(input: PratinjauInput)` → `Pratinjau`

```ts
type PratinjauInput = {
  items: { productId: number; variantId: number | null; quantity: number }[];
  addressId?: number;                                            // ada sejak langkah 1
  shippingMethod?: 'jne_reg' | 'sicepat_reg' | 'gosend_instant'; // ada sejak langkah 2
  promoCode?: string;                                            // dari drawer keranjang
};

type Pratinjau = {
  items: {
    productId: number;
    variantId: number | null;
    name: string;
    variantName: string | null;
    image: string | null;
    price: number;     // harga DB sekarang
    weight: number;    // gram per unit
    quantity: number;
    stock: number;
    isPreorder: boolean; // pre-order boleh dipesan saat stok 0 (PRD §10.1)
    masalah: null | 'tidak_aktif' | 'varian_wajib' | 'stok_kurang' | 'stok_habis';
  }[];
  subtotal: number;
  totalWeight: number;
  shippingOptions: {         // kosong bila addressId belum ada
    method: 'jne_reg' | 'sicepat_reg' | 'gosend_instant';
    label: string;           // dari GLOSSARY
    estimate: string;        // "2-3 hari", "1-2 hari", "1-2 jam"
    cost: number;
    available: boolean;
    reason: string | null;   // alasan bila available = false
  }[];
  shippingCost: number | null;  // null bila kurir belum dipilih
  promo:
    | null
    | { ok: true; code: string; description: string; discount: number }
    | { ok: false; code: string; message: string };
  discount: number;             // 0 bila promo tidak ada / tidak berlaku
  grandTotal: number;           // subtotal + (shippingCost ?? 0) − discount
};
```

Aturan hitungan: ongkir PRD §10.3, promo PRD §10.4, pajak 0 (harga sudah
termasuk PPN, §10.2). Rinciannya di skill `tokokita-pesanan` §1–2.

## 5. Buat pesanan (langkah 4: tombol "Buat Pesanan")

`buatPesanan(input: CheckoutInput)`, dipanggil dengan **objek biasa** (bukan
`FormData`) karena `items` berupa array.

```ts
// src/lib/validations/checkout.ts (usulan)
export const itemKeranjangSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable(),
  quantity: z.number().int().min(1).max(99), // D13
});

export const checkoutSchema = z.object({
  addressId: z.number().int().positive(),
  shippingMethod: z.enum(['jne_reg', 'sicepat_reg', 'gosend_instant']),
  paymentMethod: z.enum(['qris', 'bank_bca', 'bank_mandiri', 'cod']),
  promoCode: z.string().trim().toUpperCase().max(30).optional().transform((s) => s || null),
  notes: z.string().trim().max(500).optional().transform((s) => s || null), // D13
  items: z
    .array(itemKeranjangSchema)
    .min(1, { error: 'Keranjang kosong' })
    .max(50) // D13
    .refine((xs) => new Set(xs.map((x) => `${x.productId}:${x.variantId}`)).size === xs.length, {
      error: 'Ada barang yang sama dua kali di keranjang',
    }),
});

export type CheckoutInput = z.output<typeof checkoutSchema>;
```

- `paymentMethod: 'qris'` mencakup GoPay, OVO, dan DANA. UI tidak mengirim
  pilihan dompet.
- `notes` = "catatan untuk penjual" (PRD §7.6) → kolom `orders.notes`.

**Hasil:**

```ts
type HasilBuatPesanan =
  | { ok: true; orderNumber: string } // "INV-202609-0001"
  | {
      ok: false;
      errors?: Partial<Record<'addressId' | 'shippingMethod' | 'paymentMethod' | 'promoCode' | 'notes' | 'items', string[]>>;
      message?: string;                  // galat umum, ditampilkan di atas ringkasan
      items?: Pratinjau['items'];        // diisi bila ada masalah stok/harga, agar UI menandai baris
    };
```

Setelah `ok: true`, UI **mengosongkan keranjang** di localStorage lalu pindah ke
halaman sukses. Action tidak memanggil `redirect()`, karena keranjang hanya bisa
dihapus di client.

**Pesan galat** (Bahasa Indonesia, dari server):

| Kondisi | Pesan |
|---|---|
| Alamat tidak ada / bukan milik pembeli | Alamat tidak ditemukan. Pilih alamat lain. |
| Produk diarsipkan | {nama} sudah tidak dijual. Hapus dari keranjang. |
| Varian belum dipilih | Pilih {variant_label} untuk {nama}. |
| Stok kurang (bukan pre-order) | Stok {nama} tinggal {n}. |
| GoSend tidak tersedia | GoSend Instant hanya untuk alamat di {STORE_CITY} dengan berat maks. 20 kg. |
| Promo tidak berlaku | Pesan spesifik PRD §10.4 (kedaluwarsa, kuota habis, minimal belanja Rp X), tanpa membocorkan kode yang tidak aktif. |

## 6. Yang disimpan di `orders`

| Kolom | Asal |
|---|---|
| `order_number` | server, `INV-{YYYY}{MM}-{0001}` (D5) |
| `user_id` | sesi |
| `subtotal`, `shipping_cost`, `discount`, `grand_total`, `total_weight` | dihitung server; `tax = 0` |
| `status`, `payment_status`, `payment_due_at` | COD → `confirmed` + `unpaid`; lainnya → `pending` + `unpaid` + 24 jam |
| `payment_method`, `shipping_method` | dari input (enum) |
| `promo_code` | kode yang **lolos** validasi ulang, atau `NULL` |
| `notes` | dari input |
| `shipping_address` | salinan JSON alamat (bentuk di bawah) |

Bentuk `shipping_address`, sama dengan `AlamatSnapshot` di `prisma/seed.ts`:

```ts
{ label: string; name: string; phone: string; street: string; city: string; district: string; province: string; postalCode: string }
```

`order_items` menyalin `name`, `variantName`, `image` (gambar pertama), `price`,
`weight`, dan `quantity` dari database saat pesanan dibuat.

## 7. Halaman sukses

Rute `/checkout/berhasil/[nomor]` *(D13)*. `page.tsx` memanggil
`requireUser(...)` di baris awal, lalu membaca pesanan dengan
`where: { orderNumber, userId }`. Nomor pesanan, total, metode bayar, dan
`payment_due_at` diambil dari database, tidak dioper dari client.

## 8. Di luar kontrak ini

- **Bayar lewat Midtrans** (D9): action terpisah setelah pesanan dibuat,
  [`runbooks/payment-midtrans.md`](runbooks/payment-midtrans.md) §4b.
- **Batalkan / Pesanan Diterima**: lewat `ubahStatus()` (PRD §10.6).
