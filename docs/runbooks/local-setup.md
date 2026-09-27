# Runbook — Setup Lokal

Dua bagian: **A. Scaffold proyek** (sekali saja, oleh A1 di Hari 1) dan
**B. Menyalakan proyek** (setiap anggota, setelah repo ada di GitHub).

Perintah ditulis untuk **Git Bash** atau terminal Laragon. Di PowerShell, kalau
muncul *"npm.ps1 cannot be loaded"*, pakai `npm.cmd` sebagai ganti `npm` atau
jalankan sekali `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Prasyarat

| Perangkat | Versi | Cek dengan |
|---|---|---|
| Node.js | 20 LTS atau lebih baru | `node --version` |
| MySQL | 8.x (bawaan Laragon) atau MariaDB 10.4+ | Laragon → *Start All* |
| Git | apa saja yang baru | `git --version` |
| Google Chrome | terbaru | untuk tes E2E |

---

## A. Scaffold proyek (sekali, A1)

Jawab dulu keputusan D1 dan D2 di [`../OPEN_DECISIONS.md`](../OPEN_DECISIONS.md).

### A1. Kenapa tidak langsung `create-next-app .`

`create-next-app` menolak folder yang sudah berisi berkas seperti `README.md`,
`CLAUDE.md`, atau `tests/`. Jadi scaffold ke folder sementara, lalu salin isinya
**tanpa menimpa** berkas yang sudah ada.

```bash
cd /c/laragon/www/e-commerce

npx create-next-app@latest _scaffold --ts --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --use-npm --skip-install

# Salin tanpa menimpa (README.md, .gitignore milik repo ini tetap dipakai)
cp -rn _scaffold/. .
```

Setelahnya periksa: `README.md` dan `.gitignore` bawaan Next.js tidak ikut
tersalin karena repo ini sudah punya versi sendiri yang lebih lengkap.

**Tiga berkas wajib digabung manual** karena repo sudah punya versi kecilnya
(dibuat untuk unit test modul pembayaran):

| Berkas | Cara menggabung |
|---|---|
| `package.json` | Ambil milik `_scaffold` sebagai dasar, lalu tambahkan `devDependencies` `vitest` dari versi repo dan skrip di A3. |
| `tsconfig.json` | Ambil milik `_scaffold` (punya plugin `next`, `jsx`, `include` untuk `.tsx`), lalu tambahkan `"noUncheckedIndexedAccess": true`. |
| `package-lock.json` | Hapus, biarkan `npm install` membuat ulang. |

`vitest.config.ts` dan `src/lib/payment/` tetap dipakai apa adanya. Lalu:

```bash
rm -rf _scaffold
npm install
```

### A2. Pasang dependency sesuai PRD §5

Ikuti dokumentasi resmi tiap library untuk versi yang terpasang, terutama
Prisma (D2) dan shadcn/ui (`npx shadcn@latest init`). Daftar dari PRD:
Prisma, Zod, React Hook Form, Zustand, Lucide React, Framer Motion, date-fns,
Nodemailer, Yet Another React Lightbox, library JWT dan bcrypt (D8).

### A3. Tambahkan skrip ke `package.json`

Nama skrip di bawah dipakai oleh semua dokumen dan skill proyek; jangan
diganti namanya. Isi perintah Prisma sesuaikan dengan versinya.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio",
    "e2e": "playwright test -c tests/e2e/playwright.config.ts",
    "e2e:report": "playwright show-report tests/e2e/.report"
  }
}
```

Unit test memakai Vitest (sudah diputuskan, lihat OPEN_DECISIONS). Untuk E2E
pasang `npm i -D @playwright/test @axe-core/playwright`. Pastikan
`npm run test` masih lulus setelah penggabungan.

### A4. Commit dan Pull Request

Repo Git sudah ada (`main` dan `develop` di
`github.com/Magang-Project-Cmlabs/ecommerce`). Scaffold dikerjakan di branch
sendiri seperti kartu lain, **sebelum** langkah A1 dijalankan:

```bash
git switch develop && git pull
git switch -c chore/scaffold-nextjs
# … langkah A1–A3 …
git add .
git status            # pastikan .env TIDAK ada di daftar
git commit -m "chore: scaffold proyek Next.js"
git push -u origin chore/scaffold-nextjs
```

Buka PR ke `develop`. Pengaturan GitHub yang disarankan (oleh admin organisasi):
`develop` sebagai default branch, proteksi `main` dan `develop` (wajib PR,
2 persetujuan).

---

## B. Menyalakan proyek (setiap anggota)

```bash
git clone https://github.com/<akun>/<repo>.git e-commerce
cd e-commerce
git switch develop
npm install
cp .env.example .env
```

1. **Buat database.** Laragon → *Start All* → *Database* (HeidiSQL), atau di
   terminal Laragon:
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
   ```
2. **Isi `.env`.** Minimal `DATABASE_URL` dan `AUTH_SECRET` (cara membuatnya
   tertulis di `.env.example`).
3. **Buat tabel dan data demo:**
   ```bash
   npm run db:reset
   ```
4. **Nyalakan:**
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000. Berhasil kalau beranda tampil dengan produk demo.

## Masalah yang sering muncul

| Gejala | Penyebab biasa | Solusi |
|---|---|---|
| `Can't reach database server at localhost:3306` | MySQL Laragon mati | Laragon → *Start All* |
| `Access denied for user 'root'` | Password root tidak kosong | Sesuaikan `DATABASE_URL` |
| `P3014` shadow database saat migrate | User DB tidak boleh membuat database | Pakai user `root` lokal |
| Port 3000 terpakai | Server lain menyala | `npm run dev -- -p 3001`, sesuaikan `APP_URL` |
| `npm.ps1 cannot be loaded` | Kebijakan skrip PowerShell | Pakai `npm.cmd` atau Git Bash |
