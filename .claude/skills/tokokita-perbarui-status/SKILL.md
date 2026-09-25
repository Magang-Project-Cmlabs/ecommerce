---
name: tokokita-perbarui-status
description: Memperbarui docs/PROJECT_STATUS.md, docs/PROGRESS.md, dan docs/SERAH_TERIMA.md setelah kartu selesai, bug diperbaiki, verifikasi dijalankan, atau keputusan diambil, agar dokumen status TokoKita selalu sesuai kenyataan kode. Pakai di akhir tugas atau akhir sesi.
---

# Memperbarui Status TokoKita

Dokumen status adalah hal pertama yang dibaca orang berikutnya. Status yang
salah lebih buruk daripada tidak ada status.

## 1. Kapan

- Kartu Trello selesai atau PR di-merge.
- Gerbang verifikasi dijalankan (hasil apa pun, termasuk `FAIL`).
- Keputusan di `OPEN_DECISIONS.md` diambil.
- Akhir sesi kerja dengan pekerjaan setengah jadi.

## 2. Berkas dan isinya

| Berkas | Perbarui | Jangan |
|---|---|---|
| `docs/PROJECT_STATUS.md` | Tanggal, tabel tahap, tabel verifikasi terakhir, kriteria PRD §22 yang terbukti, blocker | Menulis riwayat panjang |
| `docs/PROGRESS.md` | Tambah entri baru **di atas**: tanggal, anggota, kartu, branch/PR, perubahan, hasil verifikasi | Mengedit entri lama |
| `docs/SERAH_TERIMA.md` | Timpa: branch aktif, perubahan belum di-commit, pekerjaan setengah jadi, langkah berikutnya | Menyalin isi PROGRESS |
| `docs/OPEN_DECISIONS.md` | Pindahkan butir yang diputuskan ke "Sudah diputuskan" + tanggal | Menghapus konteks keputusan |
| `docs/GLOSSARY.md` | Konstanta/label baru yang dikunci di `constants.ts` | — |

## 3. Aturan

- Tanggal absolut (`25 September 2026`), bukan "kemarin".
- Status verifikasi disalin dari hasil yang benar-benar dijalankan; yang tidak
  dijalankan tetap `NOT_RUN`.
- Kriteria PRD §22 dicentang hanya dengan bukti (tes lulus atau dicek di
  browser), dan sebutkan buktinya.
- Satu fakta satu tempat. Kalau sebuah fakta sudah dimiliki dokumen lain
  (lihat `docs/DOCUMENTATION_INDEX.md`), tautkan, jangan salin.
- Dokumen status ikut di-commit dalam PR yang sama dengan perubahannya.
