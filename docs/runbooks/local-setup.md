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

## A. Scaffold proyek — **selesai 27 September 2026**

Bagian ini catatan apa yang sudah dijalankan (branch `chore/scaffold-nextjs`),
untuk rujukan bila perlu diulang. Anggota tim langsung ke bagian B.

| Keputusan | Nilai |
|---|---|
| Next.js (D1) | **16.3.6**, App Router, `src/`, Turbopack, alias `@/*` |
| Prisma (D2) | **7.10.0** untuk `prisma`, `@prisma/client`, `@prisma/adapter-mariadb` — dikunci persis. Tag `latest` milik CLI `prisma` menunjuk RC 8.0, jangan dipakai. |
| shadcn | base **Radix**, preset **Nova**, ikon Lucide |

### A1. Scaffold ke folder sementara

`create-next-app` menolak folder yang tidak kosong, dan npm menolak nama
folder berawalan garis bawah — jadi pakai `scaffold-tmp`, lalu salin tanpa menimpa:

```bash
npx create-next-app@16.3.6 scaffold-tmp --ts --tailwind --eslint --app --src-dir   --import-alias "@/*" --use-npm --skip-install --disable-git --yes
cp -rn scaffold-tmp/. .
rm -rf scaffold-tmp
```

Berkas yang bentrok dan cara menanganinya:

| Berkas | Tindakan |
|---|---|
| `package.json`, `tsconfig.json` | Digabung: dasar dari scaffold + skrip, `vitest`, dan `noUncheckedIndexedAccess` dari repo |
| `AGENTS.md`, `CLAUDE.md` | Versi repo dipertahankan. `next dev` menyisipkan blok `nextjs-agent-rules` ke `AGENTS.md` sendiri (tidak menimpa isi lain); blok itu di-commit |
| `README.md`, `.gitignore` | Versi repo dipertahankan |

### A2. Dependency (PRD §5)

```bash
npm i -E @prisma/client@7.10.0 @prisma/adapter-mariadb@7.10.0
npm i -D -E prisma@7.10.0
npm i zod react-hook-form @hookform/resolvers zustand lucide-react framer-motion   date-fns nodemailer yet-another-react-lightbox jose @node-rs/argon2 bcryptjs dotenv server-only
npm i -D @types/nodemailer @playwright/test @axe-core/playwright
npx prisma init --datasource-provider mysql --output ../src/generated/prisma
npx shadcn@4.21.0 init -b radix -p nova --no-monorepo --no-rtl -y
```

Catatan:
- `prisma init` membuat `prisma7.config.ts` (URL database dibaca dari `.env`
  lewat `dotenv`) dan `prisma/schema.prisma` tanpa model. Client dihasilkan ke
  `src/generated/prisma/` (diabaikan Git; dibuat ulang otomatis oleh
  `postinstall`).
- `prisma init` juga **memasang 9 skill agent** ke `.claude/`, `.agents/`,
  `.windsurf/`. Yang disimpan hanya `prisma-cli`, `prisma-client-api`,
  `prisma-database-setup` di `.claude/skills/` sebagai folder biasa (bukan
  symlink); sisanya (Postgres, MongoDB, Prisma Compute, upgrade v6) dibuang.
- `shadcn init` menambah `components.json`, `src/lib/utils.ts` (fungsi `cn`
  dari paket resmi `cn` milik shadcn), dan token di `globals.css`. Font Inter
  dan token warna `DESIGN.md` dikerjakan di kartu A2.

### A3. Skrip

Lihat `package.json`. Yang tidak biasa:
- `typecheck` = `next typegen && tsc --noEmit` — Next 16 membuat tipe rute
  global (mis. `LayoutProps`) lewat `next typegen`; tanpa itu `tsc` gagal.
- `prepare` memasang hook `pre-push`; `postinstall` menjalankan `prisma generate`.
- `db:reset` = `migrate reset` → `generate` → `db seed`, karena Prisma 7 tidak
  lagi menjalankan seed otomatis setelah reset.

---

## B. Menyalakan proyek (setiap anggota)

```bash
git clone https://github.com/Magang-Project-Cmlabs/ecommerce.git e-commerce
cd e-commerce
git switch develop
npm install
cp .env.example .env
```

`npm install` sekaligus memasang hook `pre-push` (menolak push langsung ke
`develop`/`main`) dan membuat Prisma client. Cek: `git config core.hooksPath`
harus menampilkan `.githooks`.

1. **Buat database.** Laragon → *Start All* → *Database* (HeidiSQL), atau di
   terminal Laragon:
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
   ```
2. **Isi `.env`.** Minimal `DATABASE_URL` dan `AUTH_SECRET` (cara membuatnya
   tertulis di `.env.example`). Opsional: `ASISTEN_API_KEY` (kunci gratis Google
   AI Studio) agar tombol "Tanya AI" tampil; tanpa kunci aplikasi tetap jalan.
3. **Buat tabel dan data demo:**
   ```bash
   npm run db:reset
   ```
   Perintah ini menghapus isi database lokal. AI agent wajib meminta
   persetujuanmu dulu; Prisma 7 memblokirnya bila dijalankan agent tanpa izin.
4. **Nyalakan:**
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000. Saat ini yang tampil masih halaman bawaan
   Next.js; beranda TokoKita dibangun di kartu A2.

## Masalah yang sering muncul

| Gejala | Penyebab biasa | Solusi |
|---|---|---|
| `Can't reach database server at localhost:3306` | MySQL Laragon mati | Laragon → *Start All* |
| `Access denied for user 'root'` | Password root tidak kosong | Sesuaikan `DATABASE_URL` |
| `P3014` shadow database saat migrate | User DB tidak boleh membuat database | Pakai user `root` lokal |
| Port 3000 terpakai | Server lain menyala | `npm run dev -- -p 3001`, sesuaikan `APP_URL` |
| `npm.ps1 cannot be loaded` | Kebijakan skrip PowerShell | Pakai `npm.cmd` atau Git Bash |

## Catatan data uji E2E

Tes `commerce` dan `katalog` membeli ukuran M Kaos Polos Premium di DB uji
(`ecommerce_verifikasi_*`). Setelah beberapa putaran stok M habis dan tes gagal di
`getByRole('radio', { name: 'M' })`. Isi ulang stok M di DB uji (jangan XL: tes katalog
membutuhkan XL tetap 0), atau seed ulang DB uji. Bukan bug aplikasi.
