---
name: tokokita-ui
description: Membangun dan memoles halaman serta komponen TokoKita dengan shadcn/ui, token warna DESIGN.md yang lulus WCAG AA, keadaan lengkap (loading, kosong, error, sukses), teks Bahasa Indonesia, dan tata letak mobile-first 360 px. Pakai setiap kali membuat atau mengubah halaman, komponen, form, tabel, atau layout di src/app dan src/components.
---

# UI TokoKita

Sumber aturan: `DESIGN.md` (token, tipografi, komponen) dan PRD §7, §8, §17-19
(isi halaman). Skill global `frontend` / `frontend-design` tetap berlaku untuk
prinsipnya; skill ini yang mengikatnya ke repo ini.

## 1. Sebelum menulis komponen

1. Cek `src/components/ui/` — sudah ada? Pakai.
2. Belum ada tapi tersedia di shadcn? `npx shadcn@latest add <nama>`.
3. Komponen fitur yang dipakai ≥ 2 halaman → `src/components/<fitur>/`.
4. Jangan memasang library UI lain, jangan menyalin komponen shadcn lalu
   memodifikasinya di tempat lain.

## 2. Warna dan kontras

Pakai token (`bg-primary`, `text-muted-foreground`, `ring-ring`). Aturan yang
paling sering dilanggar:

- Palet monokrom dengan mode terang dan gelap (D16): `bg-primary` hitam di
  terang / putih di gelap, ubin `bg-tile`, teks sekunder `text-muted-foreground`.
- Merah `bg-sale` hanya untuk label diskon dan hati wishlist; harga memakai
  warna teks biasa (`font-semibold tabular-nums`).
- Warna status memakai pasangan gelap, mis. `text-green-700 dark:text-green-300`.
- Jangan memakai `zinc-*`, `gray-*`, `orange-*`, `bg-white`, `text-black`.
- Daftar pilihan: komponen `Pilihan`, bukan `<select>` bawaan. Form tambah/edit
  admin: `ModalAdmin`. Konfirmasi (hapus, batal, keluar): `AlertDialog`.

## 3. Server vs client

- Halaman dan bagian yang hanya menampilkan data: Server Component, data dari
  `src/lib/data/`.
- `"use client"` hanya untuk bagian interaktif (tombol keranjang, pilihan
  varian, form, drawer). Dorong batas client sedalam mungkin.
- Mutasi lewat Server Action + `useActionState`/`useTransition`; tombol
  menampilkan spinner dan `disabled` saat berjalan.

## 4. Setiap tampilan wajib punya

| Keadaan | Cara |
|---|---|
| Loading | `loading.tsx` per segmen dengan `Skeleton` berbentuk konten |
| Kosong | teks PRD §18 persis + ajakan bertindak |
| Error | `error.tsx` dengan tombol "Coba lagi"; `not-found.tsx` untuk 404 |
| Sukses | toast Sonner dengan teks PRD §18 |
| Validasi | pesan per field dari skema Zod yang sama dengan server |
| Pending | tombol disabled + spinner, cegah klik ganda |

## 5. Format dan teks

- Harga lewat `formatRupiah()` dan tanggal lewat `formatTanggal()` dari
  `src/lib/format.ts` — jangan `toLocaleString` di tempat.
- Label status dari konstanta (lihat `docs/GLOSSARY.md`).
- Semua teks Bahasa Indonesia. Tidak ada "Submit", "Loading…", "No data".

## 6. Aksesibilitas

- Satu `<h1>` per halaman; urutan heading tidak melompat.
- Setiap input punya `<Label>`; ikon-saja punya `aria-label` (wishlist,
  keranjang, +/−, tutup).
- Gambar produk punya `alt` berisi nama produk (+ varian bila relevan).
- Fokus terlihat; drawer/dialog mengunci fokus dan bisa ditutup dengan Esc
  (bawaan Radix — jangan dirusak).
- Badge jumlah keranjang diumumkan (`aria-live="polite"` atau label tombol
  "Keranjang, 3 barang").

## 7. Mobile-first

Tulis kelas untuk 360 px dulu, lalu `md:`/`lg:`. Uji dengan nama produk panjang,
harga jutaan, 0 item, dan 50 item. Tidak boleh ada gulir mendatar.

## 8. Performa (PRD §14)

`next/image` dengan `sizes`; gambar di atas lipatan (banner pertama, gambar
utama detail produk) memakai `priority`. Hindari `"use client"` di layout.
Skeleton berukuran sama dengan konten akhir agar CLS < 0,1.

## 9. Verifikasi

Buka halamannya di browser (desktop dan 360 px), cek console dan network, lalu
jalankan tes E2E halaman terkait. Tanpa melihat hasilnya di browser, statusnya
`NOT_RUN`, bukan `PASS`.
