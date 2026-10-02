# PRD - E-Commerce

## 1. Ringkasan Produk
Toko online dengan katalog produk, keranjang belanja, checkout bertahap, akun pelanggan, riwayat pesanan, dan panel admin untuk mengelola produk serta pesanan.

## 2. Latar Belakang & Target Pengguna

**Latar belakang**
Toko ini dipakai oleh brand/UMKM Indonesia untuk menjual produk (fashion, elektronik, rumah tangga, kecantikan, olahraga) secara langsung, tanpa bergantung pada marketplace dan komisinya.

**Target pengguna**
| Peran | Deskripsi | Kebutuhan utama |
|---|---|---|
| Pembeli | Usia 18-40 tahun, mayoritas belanja lewat HP | Cari produk cepat, checkout singkat, lacak pesanan |
| Admin toko | Pemilik atau staf toko | Kelola produk & stok, proses pesanan, input resi |

## 3. Tujuan & Metrik
| Metrik | Target |
|---|---|
| Conversion rate (pengunjung → pembeli) | ≥ 2% |
| Checkout completion (mulai checkout → pesanan dibuat) | ≥ 60% |
| Waktu checkout rata-rata | < 3 menit |
| Pesanan batal karena tidak dibayar | < 20% |
| LCP halaman produk (4G) | < 2,5 detik |

## 4. Syarat Wajib
- Framework: **Next.js** (App Router, TypeScript)
- Database: **MySQL** (MySQL 8 / MariaDB 10.4+)
- Semua data disimpan di MySQL
- Checkout membuat pesanan di database dan mengurangi stok

## 5. Tech Stack
| Kebutuhan | Teknologi |
|---|---|
| Framework | Next.js (App Router) + React + TypeScript |
| Database | MySQL |
| ORM | Prisma |
| Styling | Tailwind CSS |
| Komponen | shadcn/ui |
| Ikon | Lucide React |
| Animasi | Framer Motion |
| State client | Zustand (keranjang di localStorage) |
| Form & validasi | React Hook Form + Zod |
| Autentikasi | Argon2id + session JWT (cookie httpOnly) — semula bcrypt, diganti keputusan D17 |
| Email | Nodemailer (SMTP) |
| Penyimpanan gambar | S3-compatible (Cloudflare R2) di production, disk lokal di development |
| Tanggal | date-fns (locale `id`) |
| Galeri gambar | Yet Another React Lightbox |

## 6. Prioritas & Tahapan

| Tahap | Cakupan | Prioritas | Estimasi |
|---|---|---|---|
| 1. Fondasi | Setup proyek, skema database, seed, layout, auth (daftar, masuk, lupa password) | MVP | 1 minggu |
| 2. Katalog | Beranda, daftar produk, detail produk, pencarian | MVP | 1 minggu |
| 3. Keranjang & Checkout | Keranjang, promo, checkout, ongkir, batas bayar, email pesanan | MVP | 1,5 minggu |
| 4. Akun & Admin | Riwayat pesanan, alamat, admin pesanan & produk | MVP | 1,5 minggu |
| 5. Pelengkap | Wishlist, ulasan, admin promo & banner, dashboard admin | Lanjutan | 1 minggu |
| 6. Rilis | SEO, halaman legal, QA responsif, deployment, backup | MVP | 0,5 minggu |

## 7. Halaman & Fitur Pembeli

### 7.1 Header Global
- Logo + nama toko (kiri)
- Pencarian dengan saran otomatis (tengah)
- Ikon Akun, Wishlist, Keranjang dengan badge jumlah
- Mega-menu kategori saat hover

### 7.2 Beranda — `/`
- Carousel banner promo
- Produk unggulan
- Kartu kategori
- Produk trending (terlaris 30 hari terakhir)

### 7.3 Daftar Produk — `/produk`
- Filter: kategori, rentang harga, rating, merek
- Tampilan grid (3-4 kolom) atau list
- Urutan: Terpopuler, Termurah, Termahal, Terbaru
- Pagination (24 produk per halaman)
- Filter tersimpan di URL: `q`, `kategori`, `min`, `max`, `rating`, `brand`, `urut`, `hal`, `tampilan`

### 7.4 Detail Produk — `/produk/[slug]`
- Galeri gambar dengan zoom
- Nama, rating, harga, harga coret, persentase hemat
- Pilihan varian; harga dan stok berubah sesuai varian
- Varian yang habis tidak bisa dipilih
- Input jumlah, tombol "Masukkan Keranjang" dan "Beli Sekarang"
- Deskripsi, spesifikasi, ulasan (badge "Pembeli Terverifikasi")

### 7.5 Keranjang (Drawer)
- Daftar item: gambar, nama, varian, jumlah, harga
- Ubah jumlah dan hapus item
- Input kode promo (divalidasi server)
- Subtotal dan tombol checkout
- Peringatan jika harga berubah atau stok habis

### 7.6 Checkout — `/checkout` (wajib login)
1. Alamat Pengiriman — pilih alamat tersimpan atau tambah baru
2. Metode Pengiriman — JNE Regular, SiCepat REG, GoSend Instant (sesuai ketersediaan untuk alamat), dengan ongkir sesuai berat
3. Metode Pembayaran — QRIS (GoPay, OVO, DANA), Transfer Bank (BCA, Mandiri), COD
4. Konfirmasi Pesanan — ringkasan, catatan untuk penjual, tombol "Buat Pesanan"

Setelah berhasil: halaman sukses dengan nomor pesanan, total, dan batas waktu pembayaran.

### 7.7 Akun
- `/masuk`, `/daftar` (dengan persetujuan Syarat & Ketentuan dan Kebijakan Privasi)
- `/lupa-password`, `/reset-password?token=...`
- `/akun` — profil, ganti password, buku alamat, hapus akun
- `/akun/pesanan` — riwayat pesanan per status
- `/akun/pesanan/[nomor]` — detail, timeline status, nomor resi, hitung mundur batas bayar, tombol "Bayar Sekarang" (simulasi), "Batalkan", "Pesanan Diterima", dan "Beri Ulasan"
- `/wishlist`

### 7.8 Halaman Informasi
- `/kebijakan-privasi`
- `/syarat-ketentuan`
- `/bantuan` (FAQ: pembayaran, pengiriman, pengembalian)

## 8. Panel Admin — `/admin` (role `admin`)

| Halaman | Fitur |
|---|---|
| `/admin` | Ringkasan: pesanan hari ini, omzet 7/30 hari, pesanan perlu diproses, produk stok menipis (≤ 5) |
| `/admin/pesanan` | Daftar & filter status, detail pesanan, ubah status, input nomor resi, konfirmasi pembayaran manual, batalkan dengan alasan |
| `/admin/produk` | Tambah/edit/arsipkan produk, varian, stok, berat, upload gambar |
| `/admin/kategori` | Kelola kategori dan sub-kategori |
| `/admin/promo` | Kelola kode promo, lihat jumlah pemakaian |
| `/admin/banner` | Kelola banner beranda dan urutannya |

- Produk tidak dihapus permanen, tetapi diarsipkan (`is_active = false`) agar riwayat pesanan tetap utuh.
- Setiap perubahan status pesanan tercatat di `order_status_logs`.

## 9. Struktur Database
Harga disimpan sebagai INT (rupiah), berat dalam gram. Charset `utf8mb4_unicode_ci`.

```sql
users                 (id, name, email UNIQUE, phone, password_hash,
                       role ENUM('customer','admin'), created_at, deleted_at NULL)

password_reset_tokens (id, user_id FK, token_hash, expires_at, used_at NULL, created_at)

addresses             (id, user_id FK, label, name, phone, street, city, district,
                       province, postal_code, is_default)

categories            (id, name, slug UNIQUE, image, parent_id FK NULL, sort_order)

products              (id, name, slug UNIQUE, description TEXT, specs JSON,
                       price INT, compare_at_price INT NULL, brand, category_id FK,
                       tags JSON, weight INT, rating DECIMAL(2,1), review_count INT,
                       sold_count INT, stock INT, is_preorder, is_featured, is_active,
                       variant_label, created_at, updated_at)

product_images        (id, product_id FK, url, sort_order)

product_variants      (id, product_id FK, name, price INT NULL, weight INT NULL,
                       stock INT, sort_order)

reviews               (id, product_id FK, user_id FK, order_item_id FK UNIQUE,
                       rating TINYINT, content TEXT, images JSON, created_at)

wishlist_items        (user_id FK, product_id FK, created_at)

promo_codes           (code PK, description, type ENUM('PERCENT','FIXED'), value INT,
                       min_subtotal INT, max_discount INT NULL, quota INT NULL,
                       used_count INT, per_user_limit INT, starts_at, expires_at,
                       is_active)

promo_usages          (id, code FK, user_id FK, order_id FK, created_at)

banners               (id, title, subtitle, cta, href, image, sort_order, is_active)

orders                (id, order_number UNIQUE, user_id FK, subtotal INT,
                       shipping_cost INT, discount INT, tax INT, grand_total INT,
                       total_weight INT,
                       status ENUM('pending','confirmed','packed','shipped','delivered','cancelled'),
                       payment_method, payment_status ENUM('paid','unpaid','refunded'),
                       payment_due_at NULL, paid_at NULL,
                       shipping_address JSON, shipping_method, tracking_number NULL,
                       promo_code NULL, notes TEXT, cancel_reason NULL,
                       shipped_at NULL, delivered_at NULL, cancelled_at NULL, created_at)

order_items           (id, order_id FK, product_id FK, variant_id FK NULL, name,
                       variant_name, image, price INT, weight INT, quantity INT)

order_status_logs     (id, order_id FK, status, note, changed_by FK NULL, created_at)
```

Aturan data:
- `product_variants.price` / `weight` NULL berarti sama dengan nilai di produk
- `order_items` dan `orders.shipping_address` menyimpan salinan data saat pesanan dibuat
- `rating` dan `review_count` dihitung ulang setiap ada ulasan baru
- Unique: `reviews.order_item_id`, `wishlist_items (user_id, product_id)`
- Index: `products.category_id`, `products.brand`, `products.price`, `orders.user_id`, `orders.status`, `orders.payment_due_at`

## 10. Aturan Bisnis

### 10.1 Stok
- Produk **tanpa varian**: stok memakai `products.stock`.
- Produk **dengan varian**: stok memakai `product_variants.stock`; `products.stock` diisi otomatis dengan total stok varian (hanya untuk tampilan dan filter).
- Produk dengan varian wajib memilih varian sebelum masuk keranjang.
- Produk pre-order bisa dipesan saat stok 0, dengan label estimasi kirim.

### 10.2 Harga & Pajak
- Semua harga produk **sudah termasuk PPN 11%**.
- `orders.tax` diisi 0; invoice menampilkan keterangan "Harga sudah termasuk PPN".

### 10.3 Ongkir
Ongkir = tarif per kg × total berat (dibulatkan ke atas, minimal 1 kg).

| Kurir | Estimasi | Tarif | Syarat |
|---|---|---|---|
| JNE Regular | 2-3 hari | Rp 15.000/kg | - |
| SiCepat REG | 1-2 hari | Rp 13.000/kg | - |
| GoSend Instant | 1-2 jam | Rp 30.000 flat | Alamat di kota yang sama dengan toko, berat ≤ 20 kg |

- Kota asal toko diatur lewat konfigurasi (`STORE_CITY`).
- Tarif belum membedakan kota tujuan (lihat Di Luar Cakupan).

### 10.4 Kode Promo
- Maksimal 1 kode promo per pesanan.
- Diskon dihitung dari subtotal (tidak termasuk ongkir).
- Promo valid jika: aktif, dalam periode `starts_at`–`expires_at`, kuota belum habis, belum melebihi `per_user_limit`, dan subtotal ≥ `min_subtotal`.
- Pemakaian dicatat di `promo_usages` saat pesanan dibuat, dan dikembalikan jika pesanan dibatalkan.

| Kode | Jenis | Nilai | Min. Belanja | Maks. Diskon | Batas per User |
|---|---|---|---|---|---|
| HEMAT10 | Persen | 10% | Rp 100.000 | Rp 50.000 | 1 |
| ONGKIRFREE | Nominal | Rp 20.000 | Rp 150.000 | - | 3 |
| BELANJA50 | Nominal | Rp 50.000 | Rp 500.000 | - | 1 |

### 10.5 Buat Pesanan
Dijalankan dalam satu transaksi:
1. Ambil harga, berat, dan stok dari database (data dari client diabaikan)
2. Tolak jika stok tidak cukup
3. Validasi ulang promo dan ketersediaan kurir
4. Hitung subtotal, ongkir, diskon, total
5. Kurangi stok dengan syarat `stock >= jumlah`
6. Tambah `sold_count`, catat `promo_usages`
7. Buat nomor pesanan `INV-{TAHUN}{BULAN}-{0001}` (urutan direset setiap bulan)
8. Status awal:
   - COD → `confirmed`, `unpaid` (dibayar saat barang diterima)
   - Metode lain → `pending`, `unpaid`, `payment_due_at` = 24 jam
9. Catat log status dan kirim email konfirmasi

### 10.6 Alur Status Pesanan
```
pending ──bayar──→ confirmed ──→ packed ──→ shipped ──→ delivered
   │                   │
   └──→ cancelled ←────┘
```

| Perubahan | Oleh | Syarat |
|---|---|---|
| pending → confirmed | Sistem (bayar) / Admin (konfirmasi manual) | `payment_status` jadi `paid` |
| pending → cancelled | Pembeli / Admin / Sistem | Pembeli & admin kapan saja sebelum bayar; sistem jika lewat `payment_due_at` |
| confirmed → cancelled | Admin | Wajib alasan; jika sudah bayar, `payment_status` jadi `refunded` |
| confirmed → packed | Admin | - |
| packed → shipped | Admin | Wajib nomor resi |
| shipped → delivered | Pembeli ("Pesanan Diterima") / Sistem | Sistem otomatis 7 hari setelah dikirim; COD jadi `paid` |

- Setiap pembatalan mengembalikan stok dan kuota promo.
- Job terjadwal `GET /api/cron/orders` (setiap 15 menit, dilindungi `CRON_SECRET`) membatalkan pesanan yang lewat batas bayar dan menyelesaikan pesanan yang dikirim > 7 hari.

### 10.7 Ulasan
- Hanya pembeli dengan item pesanan berstatus `delivered`.
- Satu ulasan per item pesanan; dapat ditulis maksimal 30 hari setelah pesanan selesai.
- Rating 1-5, teks 10-1000 karakter, maksimal 3 foto.

### 10.8 Pengguna Tamu
- Tamu bisa melihat produk dan mengisi keranjang.
- Klik wishlist atau checkout → diarahkan ke `/masuk?next=...`, lalu aksi dilanjutkan setelah login.
- Keranjang tersimpan di localStorage dan tetap ada setelah login di perangkat yang sama (tidak sinkron antar perangkat).

### 10.9 Akun & Password
- Lupa password: link reset dikirim via email, berlaku 1 jam, sekali pakai. Respons selalu sama, baik email terdaftar maupun tidak.
- Ganti password wajib memasukkan password lama.
- Hapus akun: data pribadi dianonimkan, riwayat pesanan tetap disimpan untuk keperluan pembukuan.

### 10.10 Gambar Produk
- Format JPG/PNG/WebP, maksimal 2 MB, minimal 800×800 px, maksimal 8 gambar per produk.
- Upload lewat admin ke storage (`lib/storage.ts`): disk lokal di development, S3-compatible di production.
- Ditampilkan dengan `next/image`.

## 11. Notifikasi Email
| Pemicu | Isi |
|---|---|
| Pesanan dibuat | Ringkasan pesanan, total, cara bayar, batas waktu bayar |
| Pembayaran diterima | Konfirmasi pembayaran |
| Pesanan dikirim | Kurir dan nomor resi |
| Pesanan dibatalkan | Alasan pembatalan |
| Lupa password | Link reset password |

## 12. Arsitektur
- Server Components untuk halaman yang membaca data
- Server Actions untuk semua perubahan data
- Route Handler:
  - `GET /api/search?q=` — saran pencarian (maks. 6 hasil)
  - `GET /api/cron/orders` — job terjadwal pesanan
- Akses database hanya lewat `src/lib/data/`
- `proxy.ts` mengarahkan user yang belum login dari `/checkout`, `/akun/*`, `/wishlist`, `/admin/*` ke `/masuk?next=...`; role admin dicek ulang di server

```
prisma/        schema.prisma, migrations/, seed.ts
src/
  app/         halaman pembeli, admin, route handler
  actions/     server actions
  components/  ui, layout, product, cart, checkout, admin
  lib/         db, auth, data/, validations/, email, storage, format, constants
  stores/      cart-store
  proxy.ts
```

Environment:
```env
APP_URL="http://localhost:3000"
DATABASE_URL="mysql://root:@localhost:3306/ecommerce"
AUTH_SECRET="string-acak-minimal-32-karakter"
CRON_SECRET="string-acak"
STORE_CITY="Jakarta"

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="Toko <no-reply@domain.com>"

STORAGE_DRIVER="local"   # local | s3
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_PUBLIC_URL=""
```

Script: `dev`, `build`, `start`, `db:migrate`, `db:seed`, `db:reset`, `db:studio`

## 13. Keamanan
- Password di-hash Argon2id (semula bcrypt; D17), minimal 8 karakter
- Cookie session `httpOnly`, `secure` (production), `sameSite=lax`, berlaku 30 hari
- Semua input divalidasi Zod di server
- Cek kepemilikan data dan role di setiap aksi
- Query lewat Prisma (parameterized)
- Rate limit: login & lupa password maks. 5 percobaan/15 menit per IP
- Token reset password disimpan dalam bentuk hash
- Validasi tipe dan ukuran file saat upload

## 14. Kebutuhan Non-Fungsional

**Performa**
- LCP < 2,5 detik, CLS < 0,1 (4G, perangkat menengah)
- Lighthouse Performance ≥ 90 untuk beranda, daftar produk, dan detail produk

**SEO**
- `generateMetadata` untuk produk dan kategori (title, description, Open Graph)
- `sitemap.xml` dan `robots.txt`
- JSON-LD `Product` (harga, stok, rating) di detail produk
- Halaman akun, checkout, dan admin diberi `noindex`

**Aksesibilitas**
- Target WCAG 2.1 AA
- Bisa dioperasikan dengan keyboard, fokus terlihat, alt text di semua gambar, kontras warna cukup

**Dukungan Browser**
- Chrome, Edge, Firefox, Safari (2 versi terakhir)
- Chrome Android dan Safari iOS
- Lebar layar mulai 360 px

## 15. Privasi & Legal
- Mengikuti UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
- Checkbox persetujuan Syarat & Ketentuan dan Kebijakan Privasi saat daftar.
- Data pribadi hanya dipakai untuk memproses pesanan.
- Pengguna dapat menghapus akun sendiri (lihat 10.9).
- Tersedia halaman Kebijakan Privasi dan Syarat & Ketentuan (termasuk kebijakan pengembalian barang).

## 16. Deployment & Operasional
- **Hosting:** Vercel (perubahan target oleh pemilik proyek, 1 Oktober 2026); fungsi Next.js di region terdekat dengan database
- **Database:** Aiven managed MySQL dengan CA TLS terverifikasi, pool koneksi terbatas
- **HTTPS:** sertifikat dikelola Vercel
- **Job terjadwal:** pemanggil terautentikasi `/api/cron/orders` setiap 15 menit; Vercel Pro cron atau penjadwal eksternal untuk Hobby
- **State serverless:** hitungan rate limit tersimpan di tabel `auth_rate_limits`, gambar unggahan tersimpan di S3/R2; tiap request unggah membawa satu file maksimal 2 MB
- **Backup:** `mysqldump` harian (disimpan 7 hari) dan mingguan (disimpan 4 minggu), disalin ke storage terpisah; uji restore setiap bulan
- **Migrasi:** `prisma migrate deploy` saat rilis
- **Monitoring:** log error aplikasi dan uptime check halaman utama

## 17. Desain

**Warna**
- Primary: `orange-500`
- Secondary: `blue-600`
- Accent: `green-500`
- Netral: `zinc-50` – `zinc-900`
- Danger: merah (habis, label diskon)

**Tipografi**
- Font: Inter
- Nama produk: `text-base font-medium`
- Harga: `text-xl font-bold text-orange-600`
- Badge diskon: `text-xs font-bold bg-red-500 text-white`
- Kategori: `text-sm text-zinc-600`

**Layout**
- Container: `max-w-7xl mx-auto px-4`
- Kartu produk: `rounded-xl border shadow-sm overflow-hidden`
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
- Carousel: `h-[300px] md:h-[400px]`
- Admin: sidebar kiri + tabel data

**Kartu Produk**
```
┌───────────────────┐
│ ┌───────────────┐ │
│ │    🖼️ Gambar  │ │
│ └───────────────┘ │
│ ⭐ 4.8 (120)     │
│ Kaos Polos Premium│
│ Rp 89.000         │
│ Rp 129.000  -31%  │
│ [🛒 + Keranjang] │
└───────────────────┘
```
- Gambar 1:1, badge diskon kiri atas, ikon wishlist kanan atas
- Overlay "Habis" jika stok 0, badge "Pre-order"

**Detail Produk**
```
┌──────────────────────────────────────────────────────────────┐
│ ┌────────────┐                 Kaos Polos Premium            │
│ │  Gambar    │                 ⭐ 4.8 (120 ulasan)           │
│ │  Utama     │                 Rp 89.000                      │
│ └────────────┘                 Rp 129.000  Hemat 31%         │
│ ┌────┐ ┌────┐ ┌────┐           Ukuran: [S] [M] [L] [XL]      │
│ │ 🖼️│ │ 🖼️│ │ 🖼️│           Jumlah: [-] 1 [+]             │
│ └────┘ └────┘ └────┘           [♥ Wishlist] [🛒 + Keranjang] │
│                                                              │
│ Deskripsi | Spesifikasi | Ulasan (120)                       │
└──────────────────────────────────────────────────────────────┘
```

**Drawer Keranjang**
```
┌───────────────────────────────────────┐
│ 🛒 Keranjang Belanja (3)       [X]   │
│ ───────────────────────────────────── │
│ 🖼️ Kaos Polos M                      │
│    Rp 89.000   [-](2)[+]   Rp 178.000 │
│ 🖼️ Celana Chino L                    │
│    Rp 149.000  [-](1)[+]   Rp 149.000 │
│                                       │
│ Kode Promo: [MASUKKAN KODE] [Pakai]  │
│ Subtotal                    Rp 327.000│
│ Ongkir                 *Setelah alamat│
│ [      Checkout (Rp 327.000)      ]   │
└───────────────────────────────────────┘
```

**Progress Checkout**
```
● Alamat ──→ ● Pengiriman ──→ ● Pembayaran ──→ ○ Konfirmasi
```
- Selesai: centang hijau
- Aktif: lingkaran biru
- Berikutnya: garis abu-abu

## 18. Interaksi
- Kartu produk naik saat hover
- Drawer keranjang muncul dari kanan
- Item "terbang" ke ikon keranjang, ikon memantul kecil
- Zoom/pan halus di galeri
- Animasi progress bar checkout
- Skeleton saat loading, spinner di tombol saat aksi berjalan
- Toast: "Ditambahkan ke keranjang", "Kode promo berhasil dipakai", "Stok tidak mencukupi"
- Halaman error ("Coba lagi") dan 404

**Empty State**
- Keranjang: "Keranjang masih kosong. Yuk belanja!"
- Pencarian: "Produk tidak ditemukan. Coba kata kunci lain."
- Pesanan: "Belum ada pesanan. Mulai belanja sekarang!"
- Wishlist: "Wishlist masih kosong."
- Ulasan: "Belum ada ulasan. Jadilah yang pertama!"

## 19. Bahasa & Format
- UI: Bahasa Indonesia
- Mata uang: `Rp 89.000`
- Tanggal: `23 Sep 2026, 14.30 WIB`
- Status produk: Tersedia, Habis, Pre-order
- Status pesanan:

| Database | Label |
|---|---|
| `pending` | Menunggu Pembayaran |
| `confirmed` | Dikonfirmasi |
| `packed` | Dikemas |
| `shipped` | Dikirim |
| `delivered` | Selesai |
| `cancelled` | Dibatalkan |

## 20. Data Awal (Seed)
- 1 akun admin: `admin@tokokita.id` / `admin12345`
- 1 akun pembeli demo: `demo@tokokita.id` / `password123`, dengan 2 alamat dan 10-15 pesanan di semua status
- 6 kategori utama (Fashion Pria, Fashion Wanita, Elektronik, Rumah Tangga, Kecantikan, Olahraga), masing-masing 2-3 sub-kategori
- 20-30 produk dengan varian dan berat; campuran diskon, stok habis, dan pre-order
- 3-12 ulasan per produk
- 3 kode promo dan 3 banner

## 21. Di Luar Cakupan
- Payment gateway (pembayaran masih simulasi / konfirmasi manual admin)
- API ongkir berdasarkan kota tujuan (RajaOngkir, Biteship)
- Pelacakan resi otomatis
- Login dengan Google/media sosial
- Sinkronisasi keranjang antar perangkat
- Multi-vendor, live chat, aplikasi mobile

## 22. Kriteria Sukses
- ✅ Semua data dibaca dan disimpan di MySQL
- ✅ Katalog dengan pencarian, filter, urutan, grid/list, dan pagination
- ✅ Detail produk dengan galeri, varian, dan ulasan pembeli terverifikasi
- ✅ Keranjang dengan kontrol jumlah dan kode promo sesuai aturan kuota
- ✅ Daftar, masuk, lupa password, dan halaman yang dilindungi login
- ✅ Checkout 4 langkah dengan ongkir berdasarkan berat; stok berkurang tanpa overselling
- ✅ Pesanan otomatis batal setelah 24 jam tidak dibayar, stok dan kuota promo kembali
- ✅ Admin dapat mengelola produk, stok, dan memproses pesanan hingga selesai
- ✅ Email terkirim di setiap perubahan status penting
- ✅ Riwayat dan detail pesanan dengan timeline status
- ✅ Memenuhi target performa, SEO, dan aksesibilitas di bagian 14
- ✅ `npm run db:reset` menghasilkan data demo lengkap
- ✅ Responsif di mobile, tablet, dan desktop
