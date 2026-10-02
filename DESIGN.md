# DESIGN.md — Sistem Desain TokoKita

Maksud desain ada di PRD §17-19. Berkas ini mengikat maksud itu ke token
shadcn/ui dan memperbaiki kombinasi warna yang gagal WCAG 2.1 AA (target
PRD §14). Kalau berkas ini berbeda dari kode di `src/app/globals.css`, **kode
yang menang** — perbarui berkas ini.

**Arah visual (diperbarui 2 Oktober 2026):** bersih dan tenang, terinspirasi
Apple Store dan prinsip skill `apple-design`: kurangi sebelum menambah, foto
produk sebagai bintang, ubin abu muda alih-alih kartu bergaris, tipografi
tegas dan rapat, oranye hanya untuk aksi. Tidak ada gradien dekoratif,
bayangan tebal, atau ikon hiasan. Mockup awal di PPT slide 10–13 sudah
diganti tangkapan layar aplikasi yang berjalan.

## 1. Warna

Token semantik shadcn di `globals.css` (`:root`). Komponen memakai token
(`bg-primary`, `bg-tile`, `text-muted-foreground`), bukan warna mentah, kecuali
yang disebut di tabel "Dipakai langsung".

| Token | Nilai | Peran |
|---|---|---|
| `--primary` | orange-700 (`#c2410c`) | Aksi utama (satu per area), badge keranjang, tautan penting |
| `--primary-foreground` | white | Teks di atas `bg-primary`, kontras 5.18 (AA) |
| `--tile` | `#f5f5f7` | Ubin: latar kartu, kategori, ulasan, hero, kartu checkout/akun |
| `--secondary` | blue-600 | Terbatas: tautan tertentu (bantuan, saran cari) |
| `--destructive` | red-600 | Hapus, batal, galat (tombol: bidang merah muda) |
| `--background` / `--foreground` | white / zinc-900 | |
| `--muted-foreground` | zinc-600 | Teks sekunder, merek |
| `--border` / `--input` | zinc-200 | |
| `--ring` | blue-600 | Cincin fokus keyboard |

**Dipakai langsung (sudah dicek kontrasnya):**

| Kegunaan | Kelas | Catatan |
|---|---|---|
| Harga | `font-semibold tracking-[-0.01em]`, warna teks biasa | Netral, bukan oranye; oranye hanya aksi |
| Harga coret | `text-xs text-muted-foreground line-through` | |
| Label diskon | `rounded-full bg-zinc-900/85 text-white` | Terbaca di foto apa pun |
| Label "Hemat" (detail) | `rounded-full bg-zinc-900 text-white` | |
| Sukses (teks) | `text-green-700` | 5.02 |
| Tautan teks beroranye | `text-orange-700 underline-offset-4` | 5.18 |

Satu-satunya oranye di kode adalah `orange-600/700/800` dan token `--primary`.
Warna kustom `#FF6B00` sudah dihapus (kontras 2.8, gagal AA).

## 2. Tipografi

Font Inter lewat `next/font/google`. Jarak huruf menyesuaikan ukuran
(prinsip optical sizing): `h1` −0,025em, `h2` −0,02em, `h3` −0,01em, teks
isi normal.

| Peran | Kelas |
|---|---|
| Hero (`<h1>`) | `text-[2.5rem] md:text-6xl lg:text-[4.25rem] font-semibold leading-[1.04] tracking-[-0.035em]` |
| Judul bagian beranda | `text-[1.75rem] md:text-4xl font-semibold tracking-[-0.03em]` |
| Judul halaman dalam | `text-2xl font-bold` |
| Nama produk di kartu | `text-[15px] font-medium leading-snug` (maks. 2 baris) |
| Teks sekunder | `text-xs/sm text-muted-foreground` |
| Angka (harga, jumlah, total) | tambah `tabular-nums` |

## 3. Layout

- Container: `max-w-7xl mx-auto px-4`.
- Ubin: `rounded-3xl bg-tile`, tanpa garis dan bayangan. Latar halaman putih.
- Grid produk: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-9`.
- Kartu produk: foto 1:1 di ubin `rounded-3xl`, teks di bawah tanpa bingkai;
  harga + satu tombol kecil sejajar (di HP tombol selebar kartu). Label diskon
  kiri atas, wishlist kanan atas.
- Hero: dua kolom (teks kiri, foto produk kanan) di panel `bg-tile`, `rounded-[28px]`,
  dapat digeser (scroll-snap).
- Header: satu baris di layar lebar (logo, katalog, pencarian, ikon, akun),
  translusen (`backdrop-blur-xl`); jadi solid bila sistem memilih
  `prefers-reduced-transparency` atau `prefers-contrast: more`.
- Admin: sidebar hitam hangat penuh tinggi di kiri + bilah atas sendiri;
  header dan footer toko disembunyikan di `/admin`; di HP sidebar jadi `Sheet`.
  Aksen admin = aksen toko (oranye).
- Lebar minimum yang didukung: 360 px, tanpa gulir mendatar.
- Target sentuh minimal 44×44 px (tombol bawaan 44 px; ikon admin membesar di layar sentuh).

## 4. Tombol dan komponen

Pakai shadcn/ui (`npx shadcn@latest add <nama>`) sebelum membuat sendiri.
**Jangan menimpa warna/ukuran tombol dengan kelas sendiri**; pilih varian.

| Varian | Dipakai untuk |
|---|---|
| `default` | Aksi utama, satu per area (oranye tua, teks putih) |
| `secondary` | Pendamping di atas latar putih (abu muda) |
| `outline` | Aksi lain, termasuk di atas ubin (garis tipis, putih) |
| `ghost` | Aksi ringan tanpa bidang |
| `destructive` | Hapus/batal/arsip (merah muda, teks merah) |
| `link` | Tindakan berupa teks |

Ukuran: `default` 44 px, `sm` 36 px, `lg` 48 px, `icon` 44 px. Bentuk pil.
Keadaan: sorot (menggelap), tekan (mengecil 3 %, langsung), fokus (cincin
berjarak), nonaktif (pudar). Aksi admin (Edit, Hapus, Arsipkan, Detail, Tambah)
berupa **ikon + tulisan**.

| Kebutuhan | Komponen |
|---|---|
| Drawer keranjang (dari kanan) | `Sheet side="right"` |
| Toast | `Sonner` |
| Mega-menu kategori | `NavigationMenu` |
| Saran pencarian | `Command` / `Popover` |
| Tab deskripsi/spesifikasi/ulasan | `Tabs variant="line"` (garis bawah oranye) |
| Pilihan varian | `ToggleGroup` |
| Form | `Form` + React Hook Form + Zod |
| Loading | `Skeleton` berbentuk konten yang akan datang |
| Tabel admin | `Table` |
| Konfirmasi hapus/batal | `AlertDialog` |

Ikon: `lucide-react`. Galeri zoom: Yet Another React Lightbox. Gambar:
`next/image` dengan `sizes` yang benar.

## 5. Interaksi

Gerak dibuat dengan CSS murni (tanpa library animasi) agar LCP tidak
memburuk, dan **semuanya mati** bila `prefers-reduced-motion: reduce`:

- teks hero masuk bertahap (`hero-masuk`), foto hero bergeser pelan saat halaman
  digulir (`paralaks`, scroll-driven animation);
- kartu produk bergeser naik saat masuk layar (`geser-naik`, hanya transformasi,
  tanpa memudar agar kontras tetap terukur);
- gambar produk membesar halus saat disorot; tombol mengecil saat ditekan;
- carousel hero: scroll-snap bawaan browser (mengikuti jari 1:1, momentum,
  bisa dibalik kapan saja).

Animasi memudar (`opacity`) pada teks dihindari karena membuat pemeriksa
kontras membaca warna di tengah transisi.

## 6. Teks antarmuka

Bahasa Indonesia, kalimat pendek, kata kerja di tombol ("Masukkan Keranjang",
"Buat Pesanan"). Empty state dan toast memakai teks persis PRD §18. Label status
dari `docs/GLOSSARY.md`. Bagian "Kata pembeli" di beranda hanya berisi ulasan
terverifikasi nyata (nama disamarkan "Dewi L."), tidak pernah testimoni karangan.

## 7. Gambar demo

Foto produk di `public/demo/` adalah foto CC0/domain publik yang dipilih sesuai
produk (lihat `docs/KREDIT_FOTO.md`). Banner dan gambar kategori berupa
ilustrasi/foto yang dibuat `npm run demo:ilustrasi` (jangan menambah `--produk`
bila foto produk asli sudah terpasang). Foto produk toko sungguhan diunggah
lewat admin (penyimpanan Vercel Blob, OPEN_DECISIONS D15).
