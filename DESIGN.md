# DESIGN.md — Sistem Desain TokoKita

Maksud desain ada di PRD §17-19; palet PRD §17 diganti keputusan **D16**
(`docs/OPEN_DECISIONS.md`). Kalau berkas ini berbeda dari kode di
`src/app/globals.css`, **kode yang menang** — perbarui berkas ini.

**Arah visual (diperbarui 3 Oktober 2026; admin diselaraskan di hari yang sama):** modern dan elegan seperti template
Framer yang dipilih pemilik (ecom, sabina, sneako, horven, furnexa). Ciri
utamanya: foto lifestyle besar, judul display besar dengan jarak huruf rapat,
palet monokrom, kartu produk tanpa bingkai, aksi berupa pil kecil, pita teks
berjalan, footer hitam dengan merek besar. Tersedia **mode terang dan gelap**.
Tidak ada gradien dekoratif, bayangan tebal, atau ikon hiasan.

## 1. Warna

Token di `globals.css` (`:root` untuk terang, `.dark` untuk gelap). Komponen
memakai token, bukan warna mentah, supaya kedua mode otomatis benar.

| Token | Terang | Gelap | Peran |
|---|---|---|---|
| `--background` / `--foreground` | `#ffffff` / `#0a0a0a` | `#0b0b0b` / `#f2f2f2` | Latar dan teks |
| `--primary` | `#0a0a0a` | `#f2f2f2` | Aksi utama (satu per area) |
| `--tile` | `#f3f3f3` | `#171717` | Ubin: latar foto produk, ulasan, ikon jaminan |
| `--muted` / `--muted-foreground` | `#f4f4f4` / `#5c5c5c` | `#1a1a1a` / `#a3a3a3` | Bidang lembut, teks sekunder |
| `--border` / `--input` | `#e6e6e6` / `#e2e2e2` | `#262626` / `#2e2e2e` | Garis tipis |
| `--ring` | `#0a0a0a` | `#d4d4d4` | Cincin fokus keyboard |
| `--sale` | `#dc2626` | `#dc2626` | **Satu-satunya warna**: label diskon, titik merek, hati wishlist |

**Tetap gelap di kedua mode:** pita pengumuman dan footer (`#0a0a0a`, teks
putih). Panel admin memakai latar dan token yang sama dengan toko (ikut mode). **Selalu putih di atas foto:** judul hero, label ubin
kategori (di atas gradasi gelap).

Warna status pesanan (amber, hijau, merah, biru) memakai pasangan
`dark:bg-<warna>-500/10 dark:text-<warna>-300`. Jangan memakai `zinc-*`,
`gray-*`, `orange-*`, `bg-white`, atau `text-black` di halaman toko maupun admin.

## 2. Tipografi

Dua font lewat `next/font/google`: **Albert Sans** (judul `h1–h3`, merek;
variabel `--font-albert` → `font-heading`) dan **Inter** (isi). Judul memakai
berat 500, jarak huruf rapat: `h1` −0,035em, `h2` −0,03em, `h3` −0,015em.

| Peran | Kelas |
|---|---|
| Judul hero | `text-[2.75rem] md:text-7xl lg:text-[5.5rem] font-medium leading-[0.98] tracking-[-0.045em]` |
| Judul bagian beranda | `text-4xl md:text-6xl font-medium leading-none` |
| Judul halaman dalam | `text-4xl md:text-5xl font-medium leading-none` (detail produk: `text-3xl md:text-[2.75rem]`) |
| Judul form masuk/daftar | `text-3xl font-medium` |
| Nama produk di kartu | `text-[15px] font-medium leading-snug` (maks. 2 baris) |
| Harga | `text-[15px] font-semibold tabular-nums`, warna teks biasa |
| Teks sekunder | `text-[13px]/sm text-muted-foreground` |

## 3. Layout

- Container: `max-w-[1400px] mx-auto px-4 md:px-6` (header, beranda, halaman dalam).
- Header: pita pengumuman berjalan (judul banner aktif + info harga) → baris
  logo kiri, menu tengah (Semua Produk, Kategori, Promo), kanan pencarian pil,
  tombol mode gelap, wishlist, keranjang, akun, Masuk/Daftar. Di bawah `lg`:
  logo + ikon + tombol menu (`Sheet`), pencarian di baris kedua, navigasi bawah
  di HP. Translusen; solid bila `prefers-reduced-transparency`/`prefers-contrast: more`.
- Beranda: hero foto penuh (`rounded-[28px]`, tinggi `min(78svh,720px)`) →
  "Belanja per kategori" (bento 4×2 foto) → bagian produk (Terlaris, Pilihan
  kami, Sedang diskon, Baru datang) → ulasan nyata (satu kutipan besar + dua
  ubin) → pita teks besar → empat jaminan → footer.
- Kartu produk: foto 4:5 di ubin `rounded-2xl`, label diskon merah kiri atas,
  wishlist kanan atas, tombol bulat (Tambah ke Keranjang / Pilih Varian) kanan
  bawah foto — muncul saat disorot/fokus di desktop, selalu terlihat di layar
  sentuh. Nama + rating, merek, harga + harga coret di bawah tanpa bingkai.
- Admin: bahasa visual sama dengan toko. Sidebar terang/gelap mengikuti tema dengan
  menu pil (item aktif `bg-foreground text-background`), bilah atas translusen berisi
  tombol mode gelap, Lihat toko, dan Keluar. Judul halaman `text-4xl md:text-5xl`,
  kartu = ubin `bg-tile rounded-3xl` tanpa garis (aturan `.ui-admin` di
  `globals.css`), tabel dalam bingkai `rounded-3xl border`, angka ringkasan besar
  dengan Albert Sans; ubin "Perlu diproses" berbalik warna bila ada antrean.
  Header/footer toko disembunyikan di `/admin`; di HP sidebar jadi `Sheet`.
- **Tambah/edit admin = modal**, bukan halaman terpisah: tombol "Tambah …" membuka
  `?tambah=1`, tautan "Edit" membuka `?edit=ID` di halaman daftar yang sama
  (`ModalAdmin`). Simpan berhasil → toast, modal tertutup, daftar diperbarui.
  Klik di luar modal tidak menutup (mencegah isian hilang); Esc dan tombol ✕
  menutup. Di HP modal tampil sebagai lembar dari bawah. `/admin/produk/baru` dan
  `/admin/produk/[id]` tetap ada sebagai pengalih ke modal.
- Lebar minimum 360 px tanpa gulir mendatar; target sentuh minimal 44×44 px.

## 4. Tombol dan komponen

Pakai shadcn/ui sebelum membuat sendiri. **Jangan menimpa warna tombol**; pilih varian.

| Varian | Dipakai untuk |
|---|---|
| `default` | Aksi utama (hitam di terang, putih di gelap) |
| `secondary` | Pendamping di atas ubin abu |
| `outline` | Aksi lain (garis tipis); juga "Lihat semua" di beranda |
| `ghost` | Aksi ringan tanpa bidang (ikon header, Masuk) |
| `destructive` | Hapus/batal/arsip (bidang merah lembut) |
| `link` | Tindakan berupa teks |

Ukuran: `default` 44 px, `sm` 36 px, `lg` 48 px, `icon` 44 px. Bentuk pil.
Tombol di atas foto (CTA hero, panah carousel) memakai putih / kaca
(`bg-white/15 backdrop-blur-md`). Aksi admin berupa **ikon + tulisan**.

| Kebutuhan | Komponen |
|---|---|
| Drawer keranjang, menu HP | `Sheet side="right"` |
| Toast | `Sonner` (ikut mode lewat `useTemaGelap`) |
| Mega-menu kategori | `NavigationMenu` |
| Saran pencarian | `Popover` (id unik per instans, `useId`) |
| Mode gelap | `TemaToggle` (`src/components/layout/TemaToggle.tsx`) |
| Pilihan varian produk | `ToggleGroup` |
| Daftar pilihan (kategori, merek, rating, urutan, status, jenis promo) | `Pilihan` (`src/components/ui/pilihan.tsx`) — **jangan pernah `<select>` bawaan**. Pemicu setinggi 44 px `rounded-xl`, daftar melayang `rounded-2xl`, subkategori menjorok di bawah induknya, nilai dikirim lewat input tersembunyi |
| Kolom isian | `Input` (44 px, `rounded-xl`) dan textarea dengan gaya yang sama |
| Form tambah/edit admin | `ModalAdmin` di atas `Dialog` (`src/components/ui/dialog.tsx`) |
| Konfirmasi hapus, arsip, batal, keluar | `AlertDialog` (`rounded-3xl`, judul besar, tombol Batal + aksi). Keluar selalu dikonfirmasi ("Keluar dari akun?") lewat `TombolKeluar` |
| Tabel admin | `Table` |

## 5. Interaksi

Gerak dengan CSS murni; **semuanya mati** bila `prefers-reduced-motion: reduce`:

- teks hero masuk bertahap (`hero-masuk`), foto hero bergeser pelan saat digulir (`paralaks`);
- kartu produk bergeser naik saat masuk layar (`geser-naik`, tanpa memudar);
- pita pengumuman dan pita teks besar berjalan (`pita-jalan`, `teks-jalan`), berhenti saat disorot;
- foto membesar halus saat disorot, panah ubin kategori berputar 45°, tombol mengecil saat ditekan;
- carousel hero: scroll-snap bawaan browser.

Mode gelap dipasang sebelum halaman tampil (skrip `SKRIP_TEMA` di `<head>`),
jadi tidak ada kilatan putih; tanpa pilihan tersimpan, mengikuti sistem.

## 6. Teks antarmuka

Bahasa Indonesia, kalimat pendek, kata kerja di tombol. Klaim di pita dan
jaminan hanya yang benar di aplikasi (QRIS/BCA/Mandiri/COD, PPN 11 %, resi di
Pesanan Saya). Ulasan beranda hanya ulasan terverifikasi nyata (nama disamarkan).

## 7. Gambar demo

Foto produk, banner, dan ubin kategori di `public/demo/` adalah foto CC0/domain
publik (`docs/KREDIT_FOTO.md`). Foto toko sungguhan diunggah lewat admin
(Vercel Blob, D15). `npm run demo:ilustrasi` hanya menimpa bila diberi
`--banner`, `--kategori`, atau `--produk`.
