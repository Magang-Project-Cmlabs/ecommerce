# Generator PPT TokoKita

Membangun `docs/Presentasi_ECommerce_TokoKita.pptx` (22 slide, tema monokrom seperti
situs, catatan pembicara di setiap slide). Alat dokumentasi, bukan dependensi aplikasi:
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
| `render.ps1` | Merender setiap slide ke PNG lewat PowerPoint untuk diperiksa. |

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

Periksa hasil:

```powershell
powershell -File scripts/ppt/render.ps1 -Berkas "$PWD\docs\Presentasi_ECommerce_TokoKita.pptx" -Keluar "$PWD\scripts\ppt\render"
```

Buka `render/slide-XX.png` untuk slide yang berubah. Jangan melaporkan PPT selesai
sebelum dirender dan diperiksa.

## Mengganti tangkapan layar

1. Nyalakan server uji lokal port 3002 (lihat `docs/SERAH_TERIMA.md`, bagian QA).
2. `node ambil.cjs` (dan `node ambil-asisten.cjs` bila panel AI berubah).
3. `node aset.cjs` lalu bangun ulang PPT.

`img/`, `render/`, dan `node_modules/` tidak masuk Git.
