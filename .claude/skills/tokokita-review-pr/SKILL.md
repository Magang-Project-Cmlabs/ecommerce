---
name: tokokita-review-pr
description: Prosedur memeriksa dan menggabungkan Pull Request anggota tim TokoKita ke develop - cek kartu Trello, CI, jalankan gerbang di lokal, periksa aturan keras CLAUDE.md, beri masukan lewat review GitHub, lalu merge dan rapikan. Gunakan untuk kartu "A1 · Hari 3–6 · Cek dan gabungkan pekerjaan anggota" atau setiap kali diminta me-review PR orang lain.
when_to_use:
  - ada PR terbuka dari anggota (A2–A5) ke develop
  - diminta me-review, memberi masukan, atau menggabungkan PR orang lain
  - pengecekan harian kartu "Cek dan gabungkan pekerjaan anggota"
when_not_to_use:
  - PR buatan sendiri - pakai skill perbaikan-terverifikasi
  - PR develop -> main (akhir tahap) - butuh kriteria PRD §22, pakai agent qa-engineer
dependencies:
  - gh CLI (sudah login, izin Write)
  - CONTRIBUTING.md bagian 3 (aturan review)
  - .github/pull_request_template.md
  - agent security-reviewer, qa-engineer
---

# Review & Gabungkan PR Anggota

Tujuan: setiap PR yang masuk `develop` **terbukti jalan** dan **mematuhi aturan
keras CLAUDE.md**, dan pembuatnya belajar dari masukan yang spesifik.

## 1. Kumpulkan (tanpa mengubah apa pun)

```bash
git fetch --prune origin
gh pr list --state open --base develop
gh pr view <no> --json title,author,body,files,additions,deletions,reviews,headRefName
gh pr checks <no>
```

- **Kartu:** judul kartu Trello ada di deskripsi PR dan pembuatnya pemilik
  kartu itu. Fitur di luar kartu → minta dipindah ke kartu *Lanjutan*.
- **Ukuran:** > ± 400 baris perubahan → minta dipecah (CONTRIBUTING).
- **CI:** merah = berhenti di sini, minta diperbaiki dulu. CI tidak menjalankan
  e2e, jadi hijau belum cukup.
- **Rahasia:** `gh pr diff <no> --name-only` tidak memuat `.env`, dump SQL,
  `tests/e2e/.auth/`, atau `src/generated/`.

## 2. Jalankan di lokal

```bash
gh pr checkout <no>
npm ci                 # bila package-lock.json berubah
npm run db:migrate     # bila ada migration baru (JANGAN db:reset tanpa izin user)
npm run typecheck && npm run lint && npm run test && npm run build
npm run e2e            # untuk perubahan yang terlihat user
```

Buka halaman yang disentuh di browser (desktop + 360 px): keadaan loading,
kosong, error, sukses; tidak ada error console. Catat semua sebagai
`PASS`/`FAIL`/`NOT_RUN` — jangan menyalin klaim PASS dari deskripsi PR tanpa
menjalankannya sendiri.

## 3. Periksa aturan keras (CLAUDE.md)

Periksa diff-nya, bukan hanya berkas yang disebut di deskripsi:

| Aturan | Cara cek cepat |
|---|---|
| Harga/stok/ongkir dari server | action tidak memakai harga/berat dari `formData`; hanya id + jumlah |
| Uang & berat INT | `grep -nE "Float|Decimal|parseFloat|toFixed" ` di diff |
| Stok tanpa overselling | `updateMany` + `stock: { gte }` + cek `count` di dalam `$transaction` |
| DB hanya di `src/lib/data/` & `src/actions/` | `gh pr diff <no> \| grep -n "@/lib/db\|prisma\."` di luar folder itu; berkas `"use client"` tidak mengimpor Prisma |
| Mutasi hanya Server Action | tidak ada `route.ts` baru selain 3 yang diizinkan |
| Zod di server | skema dari `src/lib/validations/`, dipanggil di action |
| Authz di setiap aksi | `requireUser`/`requireAdmin` di action & page terlindungi; filter `userId` sesi untuk data milik pengguna |
| Status pesanan satu pintu | tidak ada `order.update({ status })` di luar fungsi transisi |
| Skema lewat migration | `schema.prisma` berubah ⇒ ada folder migration baru; migration lama tidak diedit |
| Format & bahasa | rupiah/tanggal/label status lewat `src/lib/format`, teks UI Bahasa Indonesia |

Menyentuh login, checkout, pesanan, admin, upload, cron, atau data pribadi →
jalankan agent `security-reviewer` untuk PR itu (instruksikan: read-only,
jangan mematikan proses apa pun).

## 4. Beri masukan

Tulis di GitHub, bukan hanya di chat — pembuat PR harus bisa membacanya.
**Minta persetujuan user sebelum mengirim** review atau komentar (tindakan
keluar yang dilihat orang lain).

```bash
gh pr review <no> --request-changes --body-file review.md   # ada yang wajib diperbaiki
gh pr review <no> --comment        --body-file review.md    # saran saja
gh pr review <no> --approve        --body-file review.md    # layak digabung
```

Isi `review.md`: tabel verifikasi (PASS/FAIL/NOT_RUN) + temuan berperingkat
**Wajib / Sebaiknya / Catatan**, masing-masing `berkas:baris`, alasannya, dan
contoh perbaikan. Puji hal yang dikerjakan dengan baik secara spesifik. Nada:
mengajari rekan magang, bukan menghakimi.

## 5. Gabungkan

Syarat (CONTRIBUTING bagian 3): **CI hijau** + **2 persetujuan** di tab
*Reviews* (ketua tim + satu anggota). Persetujuan A1 dihitung satu.

```bash
gh pr checks <no>          # wajib hijau, dicek ulang tepat sebelum merge
gh pr merge <no> --merge   # jangan --squash: riwayat commit anggota dipertahankan
```

Kurang persetujuan → tunggu; jangan merge atas nama anggota. Setelah merge:

1. `git switch develop && git pull --ff-only`, lalu hapus branch bila
   pembuatnya setuju (`git push origin --delete <branch>`).
2. Pastikan CI `develop` setelah merge tetap hijau (`gh run list --branch develop --limit 1`).
3. Kartu Trello pembuat → kolom *Selesai* (pemiliknya boleh memindah sendiri).
4. Catat di `docs/PROGRESS.md` bila merge mengubah status proyek
   (skill `tokokita-perbarui-status`).

## Larangan

Merge dengan CI merah · push langsung ke `develop`/`main` · push ke branch anggota
tanpa izinnya (beri saran di review) · `db:reset` tanpa izin user · menulis PASS
untuk gerbang yang tidak dijalankan sendiri.
