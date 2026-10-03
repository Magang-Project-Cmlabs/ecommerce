# Uji Mandiri — TokoKita

Cara membuktikan pekerjaanmu jalan **sebelum** membuka Pull Request. Tulis hasil
setiap pemeriksaan sebagai `PASS`, `FAIL`, atau `NOT_RUN` + alasan. Jangan pernah
menulis `PASS` untuk sesuatu yang tidak kamu jalankan.

> Perintah `npm run …` baru ada setelah proyek di-scaffold (lihat
> `runbooks/local-setup.md`).

## 1. Pemeriksaan otomatis

Jalankan berurutan; berhenti di yang pertama gagal.

| Urutan | Perintah | Lulus jika |
|---|---|---|
| 1 | `npm run typecheck` | Tidak ada error TypeScript |
| 2 | `npm run lint` | Tidak ada error ESLint |
| 3 | `npm run test` | Semua unit test lulus |
| 4 | `npm run build` | Build selesai tanpa error |
| 5 | `npm run e2e` | Semua tes E2E lulus (butuh DB berisi seed) |

Mengubah `schema.prisma`? Tambahkan `npx prisma validate` dan pastikan
`npm run db:reset` masih menghasilkan data demo lengkap.

## 2. Unit test wajib untuk logika bisnis

Aturan di `src/lib/` yang menyangkut uang dan stok wajib punya test, ditulis
**sebelum** implementasinya (lihat skill `tokokita-pesanan`):

- Ongkir: pembulatan ke atas per kg, minimal 1 kg, syarat GoSend.
- Promo: aktif, periode, kuota, batas per pengguna, minimal belanja, maks. diskon.
- Transisi status pesanan: yang boleh dan yang harus ditolak.
- Buat pesanan: stok berkurang, stok tidak cukup ditolak, dua pembeli barang
  terakhir bersamaan → hanya satu berhasil.
- Batal: stok dan kuota promo kembali.

## 3. Pemeriksaan manual di browser

Untuk perubahan yang terlihat pengguna:

- [ ] Alur utama berjalan dari awal sampai akhir
- [ ] Keadaan **loading**, **kosong**, dan **error** tampil benar
- [ ] Validasi form menampilkan pesan yang jelas dalam Bahasa Indonesia
- [ ] Layar HP 360 px: tidak ada gulir mendatar, tombol mudah disentuh
- [ ] Bisa dipakai dengan keyboard; fokus terlihat
- [ ] Console browser bersih dari error; tidak ada request gagal di tab Network
- [ ] Halaman terlindungi mengarah ke `/masuk?next=…` saat belum login
- [ ] Pembeli tidak bisa membuka data pembeli lain atau halaman `/admin`
- [ ] Tampilan benar di **mode terang dan mode gelap** (tombol bulan/matahari di header)
- [ ] Tidak ada `<select>` bawaan browser; daftar pilihan memakai komponen `Pilihan`
- [ ] Admin: tambah/edit terbuka sebagai modal, simpan menutup modal dan daftar ikut berubah
- [ ] Keluar (toko dan admin) meminta konfirmasi; "Batal" tidak mengeluarkan
- [ ] Pilihan panjang (kategori, merek) bisa dicari dengan mengetik
- [ ] "Tanya AI": jawaban sesuai data toko, menolak nomor kartu/password (dan menyamarkannya), tidak tampil di admin/checkout

## 4. Tes E2E (Playwright)

Kerangkanya di `tests/e2e/` — cara pakai di
[`../tests/e2e/README.md`](../tests/e2e/README.md). Halaman baru? Tambahkan satu
baris di `tests/e2e/helpers/pages.ts` supaya ikut disapu.

## 5. Uji akhir (Hari 6)

Periksa satu per satu 13 kriteria sukses di PRD §22 dan catat hasilnya di
`PROJECT_STATUS.md` bagian 4. Target performa: Lighthouse Performance ≥ 90 untuk
beranda, daftar produk, dan detail produk (mode production: `npm run build &&
npm run start`, bukan `dev`).


## Pengukuran performa 1 Oktober 2026

Build production lokal yang terhubung TLS Aiven diuji pada viewport mobile,
4G dan CPU 4x. Lighthouse DevTools menghasilkan 93/93/96 untuk beranda,
katalog/detail, LCP 2,344/2,351/2,246 detik dan CLS <0,001 (PASS). Simulasi
bawaan menghasilkan 80/85/85 dan LCP sekitar 4,3-4,4 detik (FAIL). Kedua
hasil dicatat; jangan mengganti laporan rendah dengan laporan tinggi tanpa
menyebut metode. Domain Vercel terbaru masih NOT_RUN.

Metode throttling adalah dua metode berbeda yang didokumentasikan oleh
[Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md).
Artifacts lokal berada di tests/e2e/.artifacts/ (diabaikan Git).
