---
name: tokokita-verifikasi
description: Gerbang verifikasi TokoKita sebelum commit, PR, atau menyatakan pekerjaan selesai - typecheck, lint, unit test, build, Prisma validate, tes E2E Playwright, dan pemeriksaan rahasia, dilaporkan dengan status PASS FAIL NOT_RUN. Pakai sebelum mengatakan selesai.
---

# Verifikasi TokoKita

## 1. Aturan pelaporan

- `PASS` — perintah benar-benar dijalankan di sesi ini dan lulus.
- `FAIL` — dijalankan dan gagal; sertakan potongan error yang relevan.
- `NOT_RUN` — tidak dijalankan; wajib alasan (mis. "skrip belum ada di
  package.json", "MySQL mati").

Jangan menyimpulkan `PASS` dari "kodenya terlihat benar" atau dari hasil sesi
sebelumnya.

## 2. Cek dulu apa yang ada

```bash
node -e "console.log(Object.keys(require('./package.json').scripts||{}).join(' '))"
```

Skrip yang tidak ada → `NOT_RUN (skrip belum dibuat)`, bukan dilewati diam-diam.

## 3. Urutan gerbang

Hentikan di kegagalan pertama, perbaiki, ulangi dari awal.

| # | Perintah | Wajib untuk |
|---|---|---|
| 1 | `npm run typecheck` | semua perubahan TS |
| 2 | `npm run lint` | semua perubahan |
| 3 | `npm run test` | perubahan di `src/lib/`, `src/actions/` |
| 4 | `npx prisma validate` | perubahan `schema.prisma` |
| 5 | `npm run db:reset` | perubahan skema atau seed (database lokal saja) |
| 6 | `npm run build` | sebelum PR |
| 7 | `npm run e2e` | perubahan yang terlihat pengguna, auth, checkout |

Di PowerShell pakai `npm.cmd` bila `npm.ps1` diblokir.

## 4. Tes E2E

Kerangka di `tests/e2e/` (lihat README-nya). Pelajaran dari proyek sebelumnya:

- **Sapu semua halaman, bukan sebagian.** Perubahan di layout, `globals.css`,
  atau komponen bersama merusak halaman yang tidak disangka. Daftar halaman di
  `tests/e2e/helpers/pages.ts`; halaman baru = tambah satu baris.
- **Jangan memalsukan sesi login.** Sesi didapat dengan login sungguhan lewat
  form (`helpers/auth.ts`), bukan menulis cookie JWT sendiri.
- **Pakai `waitUntil: 'load'`**, bukan `'networkidle'` — dev server Next.js
  menjaga koneksi HMR sehingga `networkidle` bisa tidak pernah tercapai.
- **Emulasi HP lengkap** lewat project `mobile`, bukan hanya `setViewportSize`.
- **Kegagalan massal `ERR_CONNECTION_REFUSED`** biasanya server/MySQL mati, bukan
  kode rusak. Cek server dulu.

## 5. Pemeriksaan rahasia

```bash
git status --short
git diff --cached --name-only | grep -Ei '(^|/)\.env($|\.)|\.sql$|\.pem$' && echo "BERHENTI: berkas rahasia ter-stage"
```

`.env.example` dan `prisma/migrations/**/*.sql` boleh.

## 6. Format laporan

```
| Pemeriksaan        | Status  | Catatan |
|--------------------|---------|---------|
| npm run typecheck  | PASS    |         |
| npm run test       | FAIL    | promo.test.ts: kuota habis masih valid |
| npm run e2e        | NOT_RUN | MySQL lokal mati |
```

Setelah itu perbarui `docs/PROJECT_STATUS.md` bagian 3 (skill
`tokokita-perbarui-status`).
