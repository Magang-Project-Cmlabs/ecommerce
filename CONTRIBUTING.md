# Cara Berkontribusi — TokoKita

Aturan ini dibuat supaya 5 orang bisa bekerja bersamaan tanpa kode bertabrakan
(Presentasi slide 15). Singkatnya: **satu kartu Trello = satu branch = satu Pull
Request.**

## 1. Branch

```
main      ← versi stabil, diperbarui di akhir tiap tahap
develop   ← tempat semua fitur digabung
feat/...  ← satu branch per kartu, dibuat dari develop
```

Buat branch baru dari `develop` yang terbaru:

```bash
git switch develop
git pull
git switch -c feat/keranjang-drawer
```

Nama branch: `<jenis>/<ringkasan-pendek>` memakai huruf kecil dan tanda hubung.
Jenis: `feat` (fitur), `fix` (perbaikan bug), `ui` (tampilan), `test`, `docs`,
`chore` (perkakas), `refactor`, `perf`.

**Jangan pernah commit langsung ke `develop` atau `main`.**

## 2. Commit

Format: `<jenis>: <apa yang berubah>`, dalam Bahasa Indonesia.

```
feat: hitung ongkir berdasarkan total berat
fix: stok tidak kembali saat pesanan dibatalkan admin
```

- Commit kecil dan sering: satu commit untuk satu perubahan yang jelas.
- Badan commit (opsional) menjelaskan **kenapa**, bukan daftar berkas.
- Jangan pernah meng-commit `.env`, dump database, atau kredensial. Cek
  `git status` sebelum `git add`.

## 3. Pull Request

1. `git push -u origin <nama-branch>`, lalu buka Pull Request ke **`develop`**.
2. Isi template PR: masalah, perubahan, cara menguji, tangkapan layar, dan hasil
   verifikasi (`PASS` / `FAIL` / `NOT_RUN`).
3. Pindahkan kartu Trello ke **Uji Coba**.
4. PR butuh **2 persetujuan**: ketua tim (A2, `@azridalimunthe7`) + satu anggota lain.
5. Setelah di-merge: pindahkan kartu ke **Selesai**, hapus branch-nya.

> **GitHub tidak memaksakan aturan ini.** Organisasi memakai paket Free dan
> repo ini private, sehingga proteksi branch tidak tersedia (keputusan
> `docs/OPEN_DECISIONS.md` D10). Tombol *Merge* tetap aktif walau belum ada
> persetujuan. Karena itu:
> - **Jangan menggabungkan PR sendiri.** Yang menekan *Merge* adalah A1 (`@kvnlhm`),
>   setelah 2 persetujuan tercatat di tab *Reviews* dan CI hijau.
> - **Pengecualian: pemilik proyek (akun `kvnlhm`)** boleh menggabungkan PR
>   tanpa menunggu persetujuan anggota lain (keputusan pemilik proyek,
>   27 Sep 2026). Pendeteksi aturan review tidak menandai merge oleh akun ini.
>   PR tetap wajib dibuat — pengecualian ini hanya untuk syarat persetujuan,
>   bukan izin push langsung ke `develop`/`main`.
> - Jangan `git push` langsung ke `develop` atau `main`.
> - PR yang ter-merge tanpa 2 persetujuan tetap di-review susulan dan dicatat
>   di rapat pagi.
>
> Penjaga gratis yang sudah disiapkan:
>
> | Penjaga | Kerjanya | Status |
> |---|---|---|
> | **Hook `pre-push`** (`.githooks/pre-push`) | Menolak `git push` ke `develop`/`main` dari laptop. Terpasang otomatis saat `npm install`. | **Aktif** |
> | **CI** (`.github/workflows/ci.yml`) | Setiap PR menjalankan typecheck, lint, test, dan build. Hasilnya (✓/✗) terlihat di PR. | Belum aktif* |
> | **Aturan review** (`.github/workflows/aturan-review.yml`) | PR digabung dengan < 2 persetujuan, push langsung, atau force push ke `develop`/`main` → tanda merah + komentar otomatis di PR. | Belum aktif* |
>
> \* GitHub Actions tampaknya dimatikan di organisasi (tidak ada workflow yang
> terdaftar maupun berjalan, dicek 27 Sep 2026). Berkasnya dibiarkan dan akan
> jalan sendiri begitu Actions diaktifkan admin. Sampai saat itu, jalankan
> `npm run typecheck` dan `npm run test` sendiri sebelum membuka PR.
>
> Hook bisa dilewati dalam keadaan darurat dengan izin A1:
> `IZINKAN_PUSH_LANGSUNG=1 git push …` — dan pelanggarannya tetap tercatat oleh
> workflow aturan review.

PR yang baik itu kecil. Lebih dari ± 400 baris perubahan? Pecah jadi beberapa PR.

## 4. Sebelum membuka PR

Jalankan pemeriksaan ini (setelah proyek di-scaffold):

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Perubahan yang terlihat pengguna juga dicek di browser, termasuk di layar HP
(360 px). Rincian: [`docs/UJI_MANDIRI.md`](docs/UJI_MANDIRI.md).

Tulis hasilnya apa adanya. Perintah yang tidak kamu jalankan ditulis `NOT_RUN`
beserta alasannya, bukan `PASS`.

## 5. Perubahan database

- Skema hanya berubah lewat `npx prisma migrate dev --name <nama>`.
- Migration yang sudah masuk `develop` **tidak boleh diedit**; buat migration baru.
- Dua orang mengubah `schema.prisma` bersamaan? Koordinasikan dengan A1 dulu.

## 6. Macet?

Macet lebih dari 2 hari → pindahkan kartu ke **Terhambat** dan bahas di rapat
pagi. Menemukan keputusan yang tidak dijawab PRD → catat di
[`docs/OPEN_DECISIONS.md`](docs/OPEN_DECISIONS.md), jangan menebak sendiri.
