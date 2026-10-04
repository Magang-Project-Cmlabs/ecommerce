# Generator PPT TokoKita

Membangun `docs/Presentasi_ECommerce_TokoKita.pptx` (25 slide, tema monokrom seperti
situs, catatan pembicara di setiap slide) dan versi PDF-nya `docs/Presentasi_ECommerce_TokoKita.pdf`
(untuk dibagikan atau dikumpulkan; tautan di slide tetap bisa diklik). Alat dokumentasi, bukan dependensi aplikasi:
pustaka `pptxgenjs` dipasang di folder ini saja.

Aturan proyek: **setiap akhir sesi kerja, perbarui PPT bersama dokumen lain** bila ada
perubahan fitur, angka uji, atau status online.

## Berkas

| Berkas | Isi |
|---|---|
| `bangun.cjs` | Seluruh isi slide (teks, angka, tabel, catatan pembicara). Ubah angka/teks di sini. |
| `aset/` | Tangkapan layar yang sudah dibulatkan + ikon Lucide (PNG), siap dipakai `bangun.cjs`. |
| `ambil.cjs` | Mengambil tangkapan layar baru dari server uji lokal `http://localhost:3002` ke `img/` (akun dari `tests/e2e/.env.e2e`, tidak dicetak). |
| `ambil-asisten.cjs` | Tangkapan layar panel "Tanya AI" dari situs produksi (memakai kuota AI gratis). |
| `aset.cjs` | Mengolah `img/*.png` menjadi `aset/` (sudut membulat, garis tipis) dan membuat ikon. |
| `ambil-foto.cjs` | Mengunduh foto profil GitHub publik kelima anggota ke `aset/foto-<akun>.png` (bulat, 400 px) untuk slide 2. Jalankan ulang bila ada yang mengganti foto. |
| `erd.cjs` | Membuat `aset/erd.png` (slide ERD) dari `prisma/schema.prisma` lewat Graphviz `dot`. Jalankan ulang bila skema berubah. |
| `render.ps1` | Merender setiap slide ke PNG lewat PowerPoint untuk diperiksa; `-Pdf <path>` sekaligus menyimpan PDF. |

`aset/admin-modal-potong.png` dan `aset/asisten-panel.png` adalah potongan manual dari
`admin-modal.png` dan `asisten.png`; potong ulang bila tangkapan aslinya diganti.

## Memperbarui PPT

```bash
cd scripts/ppt
npm ci                      # sekali
# Ubah teks/angka di bangun.cjs, lalu:
NODE_PATH="$PWD/node_modules" node bangun.cjs ../../docs/Presentasi_ECommerce_TokoKita.pptx
```

Opsional: `PPTX_APPLY_THEME=<path apply_theme.js dari skill pptx>` menulis nama tema dan
palet ke XML; tanpa itu tampilan tetap sama karena setiap elemen menulis warna dan font.

Periksa hasil dan ekspor PDF sekaligus:

```powershell
powershell -File scripts/ppt/render.ps1 -Berkas "$PWD\docs\Presentasi_ECommerce_TokoKita.pptx" -Keluar "$PWD\scripts\ppt\render" -Pdf "$PWD\docs\Presentasi_ECommerce_TokoKita.pdf"
```

Buka `render/slide-XX.png` untuk slide yang berubah. Jangan melaporkan PPT selesai
sebelum dirender dan diperiksa. PPTX dan PDF selalu dibangun bersama; jangan mengedit PDF
secara terpisah.

## ERD dari skema

Setelah migration yang menambah/mengubah tabel atau relasi (butuh Graphviz `dot` di PATH):

```bash
cd scripts/ppt && node erd.cjs   # aset/erd.png + ukurannya di aset/ukuran.json
```

ERD hanya menampilkan kolom kunci (PK, FK, unik) dengan notasi crow's foot; `auth_rate_limits`
tidak digambar karena tidak berelasi. Kelompok tabel diatur di `KELOMPOK` dalam `erd.cjs`.

## Mengganti tangkapan layar

1. Nyalakan server uji lokal port 3002 (lihat `docs/SERAH_TERIMA.md`, bagian QA).
2. `node ambil.cjs` (dan `node ambil-asisten.cjs` bila panel AI berubah).
3. `node aset.cjs` lalu bangun ulang PPT.

`img/`, `render/`, dan `node_modules/` tidak masuk Git.
