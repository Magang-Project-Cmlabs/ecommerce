# DESIGN.md — Sistem Desain TokoKita

Maksud desain ada di PRD §17-19. Berkas ini mengikat maksud itu ke token
shadcn/ui dan memperbaiki kombinasi warna yang gagal WCAG 2.1 AA (target
PRD §14). Kalau berkas ini berbeda dari kode di `src/app/globals.css`, **kode
yang menang** — perbarui berkas ini.

## 1. Warna

Token semantik shadcn di `globals.css` (`:root`). Komponen memakai token
(`bg-primary`, `text-muted-foreground`), bukan warna mentah, kecuali yang
disebut di tabel "Dipakai langsung".

| Token | Nilai | Peran |
|---|---|---|
| `--primary` | orange-500 | Tombol utama, badge keranjang, aksen merek |
| `--primary-foreground` | zinc-950 | Teks di atas `bg-primary` — **gelap, bukan putih** |
| `--secondary` | blue-600 | Langkah checkout aktif, tautan |
| `--secondary-foreground` | white | |
| `--destructive` | red-600 | Hapus, batal, galat |
| `--background` / `--foreground` | white / zinc-900 | |
| `--muted-foreground` | zinc-600 | Teks sekunder, kategori |
| `--border` / `--input` | zinc-200 | |
| `--ring` | blue-600 | Cincin fokus |

**Dipakai langsung (sudah dicek kontrasnya):**

| Kegunaan | Kelas | Kontras |
|---|---|---|
| Harga (ukuran PRD) | `text-xl font-bold text-orange-600` | 3.56 — lulus hanya sebagai teks besar |
| Harga lebih kecil dari `text-xl` | `font-bold text-orange-700` | 5.18 |
| Harga coret | `text-sm text-muted-foreground line-through` | 7.73 |
| Badge diskon | `text-xs font-bold bg-red-600 text-white` | 4.83 |
| Label "Habis" | `bg-zinc-900/70 text-white` overlay | — |
| Sukses (teks) | `text-green-700` | 5.02 |
| Sukses (ikon/centang) | `text-green-600` | 3.30 (non-teks, min. 3) |

**Kenapa berbeda dari PRD:** teks putih di atas orange-500 hanya 2.80:1,
`bg-red-500 text-white` di `text-xs` 3.76:1, dan green-500 di atas putih 2.28:1 —
ketiganya gagal AA. Angka dihitung dari hex Tailwind v3; Tailwind v4 memakai
oklch dengan nilai sedikit berbeda, jadi ukur ulang setelah token dipasang.

## 2. Tipografi

Font Inter lewat `next/font/google`. Skala dibatasi:

| Peran | Kelas |
|---|---|
| Judul halaman (`<h1>`, satu per halaman) | `text-2xl font-bold` |
| Judul bagian | `text-lg font-semibold` |
| Nama produk | `text-base font-medium` (maks. 2 baris, `line-clamp-2`) |
| Harga | lihat tabel warna |
| Kategori / teks sekunder | `text-sm text-muted-foreground` |
| Angka (harga, jumlah, total) | tambah `tabular-nums` |

## 3. Layout

- Container: `max-w-7xl mx-auto px-4`.
- Grid produk: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`.
- Kartu produk: `rounded-xl border shadow-sm overflow-hidden`, gambar 1:1,
  badge diskon kiri atas, wishlist kanan atas.
- Carousel: `h-[300px] md:h-[400px]`.
- Admin: sidebar kiri + tabel data; di HP sidebar jadi `Sheet`.
- Lebar minimum yang didukung: 360 px, tanpa gulir mendatar.
- Target sentuh minimal 44×44 px untuk tombol ikon (wishlist, +/−, tutup).

## 4. Komponen

Pakai shadcn/ui (`npx shadcn@latest add <nama>`) sebelum membuat sendiri.
Pemetaan kebutuhan PRD:

| Kebutuhan | Komponen |
|---|---|
| Drawer keranjang (dari kanan) | `Sheet side="right"` |
| Toast | `Sonner` |
| Mega-menu kategori | `NavigationMenu` |
| Saran pencarian | `Command` / `Popover` |
| Tab deskripsi/spesifikasi/ulasan | `Tabs` |
| Pilihan varian | `ToggleGroup` |
| Form | `Form` + React Hook Form + Zod |
| Loading | `Skeleton` berbentuk konten yang akan datang |
| Tabel admin | `Table` |
| Konfirmasi batal pesanan | `AlertDialog` |

Ikon: `lucide-react`. Galeri zoom: Yet Another React Lightbox. Gambar:
`next/image` dengan `sizes` yang benar.

## 5. Interaksi (PRD §18)

Transisi pendek (150-250 ms), hanya `transform`/`opacity`. Hormati
`prefers-reduced-motion` (Framer Motion: `useReducedMotion`). Animasi "terbang ke
keranjang" dan kartu naik saat hover termasuk yang dimatikan saat reduced motion.

## 6. Teks antarmuka

Bahasa Indonesia, kalimat pendek, kata kerja di tombol ("Masukkan Keranjang",
"Buat Pesanan"). Empty state dan toast memakai teks persis PRD §18. Label status
dari `docs/GLOSSARY.md`.
