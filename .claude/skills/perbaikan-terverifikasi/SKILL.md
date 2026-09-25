---
name: perbaikan-terverifikasi
description: Alur kerja baku TokoKita dari masalah sampai Pull Request - temukan masalah dengan bukti, perbaiki, buktikan di browser sungguhan dan lewat tes, commit yang menjelaskan sebab, lalu PR ke develop untuk 2 reviewer. Gunakan untuk perbaikan bug, audit keamanan, pembersihan kode, dan perbaikan tampilan.
when_to_use:
  - perbaikan bug atau tampilan
  - audit keamanan atau perbaikan celah
  - pembersihan dead code dan refactor
  - setiap kali hasil kerja perlu masuk ke develop
when_not_to_use:
  - pertanyaan yang cukup dijawab dengan membaca kode
  - perubahan ke database atau server production - selalu butuh persetujuan lebih dulu
dependencies:
  - tests/e2e/ (Playwright)
  - gh CLI (opsional, untuk membuka PR dari terminal)
---

# Perbaikan Terverifikasi

Perubahan belum selesai saat kodenya berubah. Ia selesai saat **terbukti bekerja
di browser sungguhan** dan **sudah masuk `develop` lewat Pull Request**.

## 1. Cari, jangan tebak

- **Bug:** reproduksi dulu. Tulis langkahnya, lalu tulis test yang gagal karena
  bug itu sebelum menyentuh kode.
- **Keamanan:** telusuri aliran data dari input pengguna sampai operasi sensitif
  (query Prisma, perubahan stok, penulisan berkas, redirect). Pola paling
  berbahaya di repo ini: id dari form yang langsung dipakai tanpa filter
  `userId` sesi, dan harga/jumlah dari client yang ikut dihitung.
- **Dead code:** buktikan tidak terpakai dari beberapa sumber — `grep` impor,
  rute di `src/app/`, dan pemanggilan dari form/`action=`.
- **Tampilan:** buka halamannya; jangan menyimpulkan dari CSS.

Sebut temuan dengan lokasi `berkas:baris`. Dugaan yang ternyata salah
dikatakan salah, jangan diam-diam ganti arah.

## 2. Perbaiki di tempat yang benar

- Satu helper terpusat, bukan tambalan di setiap pemanggil (mis. satu
  `requireAdmin()` dipakai semua action admin; satu `ubahStatus()` untuk semua
  perubahan status).
- Keamanan berlapis: validasi Zod + cek kepemilikan di action, bukan hanya
  menyembunyikan tombol di UI atau mengandalkan `proxy.ts`.
- Pesan galat login sama persis untuk "email tidak ada" dan "password salah".

## 3. Buktikan

```bash
npm run typecheck && npm run lint && npm run test
npm run e2e                                             # semua
npx playwright test -c tests/e2e/playwright.config.ts navigation   # sebagian
```

Lalu buka sendiri alurnya di browser, desktop dan 360 px. Aturan lengkap E2E:
skill `tokokita-verifikasi`. Tes gagal? `npm run e2e:report` menunjukkan
langkah persisnya.

## 4. Commit yang menjelaskan sebab

`<jenis>: <deskripsi>` — feat, fix, ui, refactor, docs, test, chore, perf.
Badan commit menjawab **kenapa** dan akibatnya bila dibiarkan; sertakan hasil
verifikasi dalam angka (berapa tes lulus, berapa halaman disapu).

Satu commit satu maksud. Celah keamanan yang ditemukan saat menulis tes jadi
commit `fix:` tersendiri, terpisah dari commit `test:`-nya.

## 5. Pull request, selalu

```bash
git switch develop && git pull
git switch -c fix/<ringkasan-pendek>
# … kerjakan, commit …
git push -u origin fix/<ringkasan-pendek>
gh pr create --base develop --title "…" --body-file <isi-template>
```

Isi template `.github/pull_request_template.md`. Bagian yang **belum**
terverifikasi ditulis terus terang (`NOT_RUN` + alasan). PR yang saling
bergantung menyebut urutan merge-nya.

## 6. Bereskan

Setelah merge: `git switch develop && git pull && git fetch --prune`, hapus
branch lokal. Berkas milik orang lain yang belum di-commit tidak disentuh dan
tidak ikut di-stage. Perbarui status (skill `tokokita-perbarui-status`).

## Batas yang tidak dilewati

- Database/server production: membaca boleh; menulis, migrasi, atau mengubah
  akun butuh persetujuan A1 lebih dulu.
- Kredensial tidak pernah masuk kode atau commit.
- Tidak ada commit langsung ke `develop` atau `main`.

## Menyampaikan hasil

Langkah yang harus dikerjakan anggota tim ditulis dengan bahasa awam: "buka
terminal di folder proyek, lalu ketik …", dan sebutkan apa yang terlihat kalau
berhasil.
