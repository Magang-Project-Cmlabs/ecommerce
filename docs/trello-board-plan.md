# Papan Trello — TokoKita

Board: https://trello.com/b/sqbn4ehi/tokokita-proyek-magang

Satu board, setiap anggota punya 5 kolom sendiri. Urutan kolom dari kiri:

```
👥 Semua · Rencana | 👥 Semua · Selesai
🟥 kvnlhm · Rencana | kvnlhm · Dikerjakan | kvnlhm · Terhambat | kvnlhm · Uji Coba | kvnlhm · Selesai
🟨 azridalimunthe7 · ...  🟩 rizkikusnadi03 · ...  🟦 astroceilo · ...  🟪 fikarnugraha18 · ...   (pola sama)
💤 Lanjutan (Backlog)
```

Sumber: `docs/PRD - E-Commerce.md` + `docs/Presentasi_ECommerce_TokoKita.pptx`
(slide 16 pembagian peran, slide 17 alur kerja; versi 3 Okt 2026). Durasi: **1 minggu** (Hari 1–6).

Versi ini sengaja ditulis sederhana untuk anggota pemula: satu kartu = satu fitur,
judul memakai bahasa sehari-hari, detail teknis secukupnya di checklist.

## List

Per anggota: Rencana → Dikerjakan → Terhambat → Uji Coba → Selesai.
Ditambah kolom 👥 Semua (Rencana, Selesai) dan 💤 Lanjutan (Backlog).

## Label (pemilik kartu)

| Warna | Kode | Peran | Anggota (GitHub) |
|---|---|---|---|
| Merah | A1 | Database & Login | `kvnlhm` (Kevin Ilham) — paling berpengalaman, penggabung PR |
| Kuning | A2 | **Ketua Tim** & Tampilan Katalog | `azridalimunthe7` (Azri Dalimunthe) |
| Hijau | A3 | Tampilan Keranjang & Checkout | `rizkikusnadi03` |
| Biru | A4 | Logika Pesanan | `astroceilo` |
| Ungu | A5 | Admin & Pengujian | `fikarnugraha18` |
| Oranye | Blocker | Harus selesai duluan, anggota lain menunggu | — |

Pemetaan disepakati 27 Sep 2026, mengikuti anggota organisasi GitHub (sama
dengan repo `article-website/news-times`). Presentasi versi awal (slide 14) menyebut
"Anggota 1 = Ketua Tim"; kenyataannya ketua tim adalah A2.

## Cara pakai

1. Ambil kartu berwarna labelmu dari **Rencana**, pindahkan ke **Dikerjakan**.
2. Maksimal 2 kartu di Dikerjakan per orang.
3. Sudah selesai dan sudah buat Pull Request → pindah ke **Uji Coba**.
4. Sudah dicek 2 orang dan digabung → pindah ke **Selesai**.
5. Macet lebih dari 2 hari → pindah ke **Terhambat**, bahas di rapat pagi.

## Kartu

Di Trello, kolom, judul kartu, dan label memakai **akun GitHub**, bukan kode
A1–A5 (diganti 27 Sep 2026): `kvnlhm · Hari 1 · Siapkan proyek awal dan bagikan
ke tim`, label `kvnlhm · Database`. Kartu bersama memakai `Semua · …`, kartu
Lanjutan tanpa hari (`rizkikusnadi03 · Wishlist`).

Di dokumen repo, kode A1–A5 tetap dipakai sebagai singkatan — lihat tabel
Label di atas untuk pemetaannya.

### Semua anggota
- Hari 0 · Rapat awal tim — baca PRD bersama, sepakati cara pakai GitHub, jadwal sinkronisasi 20 menit, belajar dasar Next.js & Prisma
- Hari 6 · Gabungkan semua, perbaiki bug, dan uji akhir — cek 22 kriteria sukses PRD bagian 22

### A1 — Database & Login (`kvnlhm`)
- Hari 1 · Siapkan proyek awal dan bagikan ke tim **(Blocker)**
- Hari 1 · Buat database dan isi data contoh **(Blocker)** — dikerjakan **Kevin Ilham**
- Hari 2 · Fitur daftar, masuk, dan keluar akun
- Hari 2 · Batasi halaman yang butuh login
- Hari 2 · Fitur lupa password
- Hari 3–6 · Cek dan gabungkan pekerjaan anggota
- Hari 6 · Online-kan website

### A2 — Ketua Tim & Tampilan Katalog (`azridalimunthe7`)
- Hari 1 · Siapkan warna, font, dan komponen dasar
- Hari 1 · Header dan footer website
- Hari 2 · Halaman beranda
- Hari 3 · Halaman daftar produk
- Hari 3 · Pencarian dengan saran otomatis
- Hari 4 · Halaman detail produk
- Hari 5 · Tampilan saat loading, kosong, dan error
- Hari 5 · SEO agar mudah ditemukan di Google

### A3 — Tampilan Keranjang & Checkout (`rizkikusnadi03`)
- Hari 1 · Simpan isi keranjang di browser
- Hari 2 · Keranjang belanja (panel samping)
- Hari 3 · Checkout langkah 1 & 2: alamat dan kurir
- Hari 4 · Checkout langkah 3 & 4: pembayaran dan konfirmasi
- Hari 4 · Halaman pesanan berhasil
- Hari 5 · Halaman akun saya
- Hari 5 · Halaman riwayat pesanan

### A4 — Logika Pesanan (`astroceilo`)
- Hari 1 · Aturan cek isian form (dipakai semua) **(Blocker)**
- Hari 2 · Fungsi ambil data produk dan kategori
- Hari 2 · Cek kode promo
- Hari 3 · Hitung ongkos kirim
- Hari 3 · Simpan pesanan dan kurangi stok **(Blocker)**
- Hari 4 · Kirim email notifikasi
- Hari 4 · Tombol bayar, batalkan, dan pesanan diterima
- Hari 5 · Batal otomatis setelah 24 jam
- Hari 5 · Tes dua orang membeli barang terakhir bersamaan

### A5 — Admin & Pengujian (`fikarnugraha18`)
- Hari 1 · Tampilan dasar halaman admin
- Hari 2 · Kelola produk
- Hari 2 · Kelola kategori
- Hari 3 · Kelola pesanan
- Hari 4 · Halaman ringkasan admin
- Hari 4 · Kelola promo dan banner
- Hari 5 · Halaman kebijakan privasi, S&K, dan bantuan
- Hari 5 · Tes di HP dan kecepatan halaman
- Hari 6 · Siapkan dan latih demo 7 menit

### Lanjutan (dikerjakan jika semua di atas selesai)
- Wishlist (A3)
- Ulasan pembeli (A5)
- Animasi tambahan (A2)

## Urutan penting

Hari 1, tiga kartu **Blocker** (proyek awal, database, aturan form) harus
selesai duluan — anggota lain bergantung padanya. Sambil menunggu, A2 dan A3
bisa mulai dari tampilan yang belum butuh data.
