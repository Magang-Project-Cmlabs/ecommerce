# Log Pekerjaan — TokoKita

Catatan per sesi kerja, **terbaru di atas**. Tulis singkat: apa yang dikerjakan,
berkas yang disentuh, dan hasil verifikasi (`PASS` / `FAIL` / `NOT_RUN`).

Format entri:

```markdown
### YYYY-MM-DD — <anggota> — <judul kartu / ringkasan>
- Branch / PR: feat/... / #nomor
- Perubahan: ...
- Verifikasi: typecheck PASS · lint PASS · test NOT_RUN (alasan) · ...
- Catatan / keputusan: ...
```

---

### 2026-09-27 — Kevin Ilham — A1 · Buat database dan isi data contoh
- Branch / PR: `feat/skema-database` → PR ke `develop`
- Perubahan: `prisma/schema.prisma` 15 tabel PRD §9 (snake_case lewat `@map`,
  uang/berat Int, enum status/metode bayar/kurir, indeks PRD, relasi riwayat
  `Restrict`, 4 kolom payment D9, `users.phone` boleh kosong); migration
  `20260927072940_init`; `prisma/seed.ts` data demo PRD §20 (14 pengguna termasuk
  12 pembeli contoh sumber ulasan terverifikasi, 26 produk, 79 pesanan, 188
  ulasan); `src/lib/db.ts` klien Prisma bersama (adapter MariaDB);
  `next.config.ts` mengizinkan gambar `picsum.photos`; runner seed `tsx`.
  Database lokal `ecommerce` dibuat dengan `utf8mb4_unicode_ci`.
- Verifikasi: `prisma validate` PASS · migration diterapkan PASS · struktur
  (15 tabel, collation, tipe int, indeks PRD, FK) PASS · `db:seed` PASS · 23 cek
  aturan PRD §10 = 0 pelanggaran PASS · seed diulang identik PASS · password
  bcrypt akun demo PASS · `src/lib/db.ts` terhubung PASS · typecheck/lint/test/
  build: lihat PR · `db:reset` rangkaian penuh NOT_RUN (butuh persetujuan)
- Catatan: Trello tidak bisa diubah dari sini (tanpa integrasi; board gagal
  dimuat di Chrome) — nama pemegang dicatat di `docs/trello-board-plan.md`.

### 2026-09-27 — Scaffold Next.js (A1 · Siapkan proyek awal)
- Branch / PR: `chore/scaffold-nextjs` → PR #3 (ditumpuk di atas PR #4)
- Perubahan: Next.js 16.3.6 (App Router, `src/`, Turbopack), Tailwind 4, ESLint,
  shadcn (Radix, preset Nova, paket `cn` resmi shadcn), Prisma 7.10.0 dikunci
  persis (`prisma7.config.ts`, client di `src/generated/prisma/`, adapter
  MariaDB), dependency PRD §5. Skrip `typecheck` = `next typegen && tsc`,
  `postinstall` = `prisma generate`, `db:reset` merangkai reset → generate →
  seed (Prisma 7 tidak seed otomatis). `lang="id"`, judul TokoKita. Dari 9 skill
  yang dipasang `prisma init`, 3 yang relevan disimpan sebagai folder biasa.
  Blok `nextjs-agent-rules` disisipkan `next dev` ke `AGENTS.md`.
  Runbook bagian A ditulis ulang sesuai langkah nyata (termasuk koreksi
  `_scaffold` yang ditolak npm). D1 & D2 diputuskan.
- Verifikasi (setelah `npm ci` bersih): typecheck PASS · lint PASS · test 69/69
  PASS · build PASS · `prisma validate` PASS · dev server beranda 200 PASS ·
  hook `pre-push` terpasang otomatis PASS · e2e NOT_RUN (semua halaman
  `belumAda`) · `db:reset` NOT_RUN (skema kosong)

### 2026-09-27 — Aturan review di GitHub Free (D10)
- Branch / PR: `docs/aturan-review-tanpa-proteksi` → PR #2 (hanya commit pertama
  yang ikut digabung) dan PR #4 (hook, CI, pendeteksi, pengecualian pemilik)
- Temuan: organisasi paket Free + repo private → proteksi branch dan ruleset
  ditolak GitHub (HTTP 403); akun `kvnlhm` hanya Write (admin: `azridalimunthe7`);
  PR #1 ter-merge tanpa persetujuan.
- Keputusan: tetap Free + private (D10). Pemilik proyek (`kvnlhm`) boleh merge
  tanpa persetujuan anggota lain (`PENGGABUNG_BEBAS_REVIEW`). Aturan dijaga disiplin tim dan tiga
  penjaga gratis: CI (`.github/workflows/ci.yml`), pendeteksi pelanggaran
  (`aturan-review.yml` + `.github/scripts/cek-aturan-review.mjs`), hook
  `.githooks/pre-push` (dipasang `npm install` lewat skrip `prepare`).
- Verifikasi:
  - Pendeteksi, uji lokal ke API GitHub sungguhan (DRY_RUN): PR #1 → gagal
    0/2 persetujuan; merge commit PR #1 → lolos; push langsung `e098660` →
    gagal; force push → gagal; PR ditutup tanpa merge → lolos; token salah →
    exit 2; 6 kasus hitung persetujuan — PASS
  - Hook `pre-push`: 13 kasus simulasi + `git push --dry-run` sungguhan ke
    `develop` ditolak dan ke branch lain lolos — PASS
  - Workflow di GitHub Actions: NOT_RUN — tidak ada workflow terdaftar/berjalan
    setelah push ke PR #2 (0 workflow, 0 run); kemungkinan Actions dimatikan di
    organisasi, hanya admin yang bisa memastikan. Tidak menghalangi: hook dan
    aturan manual tetap berlaku.

### 2026-09-27 — Pindah ke repo organisasi
- Branch / PR: `docs/serah-terima-repo-organisasi` → PR ke `develop`
- Perubahan: `main` dan `develop` di-push ke `Magang-Project-Cmlabs/ecommerce`
  setelah akun mendapat izin Write; remote repo sementara `kvnlhm/ecommerce`
  dilepas; `SERAH_TERIMA.md` diperbarui.
- Verifikasi: isi `main`/`develop` di GitHub sama dengan lokal (`e098660`) — PASS

### 2026-09-27 — Modul payment gateway Midtrans (sandbox)
- Branch / PR: `feat/payment-midtrans`, digabung langsung ke `main` di `kvnlhm/ecommerce` (repo sementara, tanpa PR atas permintaan pemilik proyek); `develop` lalu disamakan dengan `main`
- Perubahan: `src/lib/payment/` — adapter Midtrans Snap via `fetch` (buat sesi,
  ambil status), verifikasi `signature_key` SHA512 waktu-konstan, pemetaan
  `transaction_status` → aksi pesanan, handler webhook dengan dependensi
  disuntikkan (signature → pesanan → status diambil ulang dari API → jumlah
  cocok → transisi idempoten; bayar ulang `INV-…~n`; uang masuk untuk pesanan
  batal ditandai untuk admin). `package.json`/`tsconfig.json`/`vitest.config.ts`
  minimal untuk test. Runbook `payment-midtrans.md`, `.env.example`, D9 di
  OPEN_DECISIONS, D3 diputuskan Vitest, hook SessionStart mendeteksi scaffold
  dari dependency `next`.
- Verifikasi:
  - `npm run test`: PASS (69/69, termasuk 4 test dari temuan review keamanan)
  - Review `security-reviewer`: tanpa temuan kritis; 3 temuan pada kode diperbaiki, syarat integrasi dicatat di runbook §4e
  - `npm run typecheck`: PASS
  - Uji mutasi (cek jumlah, signature, percobaan aktif, total item dihapus satu
    per satu): tiap mutasi membuat test gagal — PASS
  - Endpoint sandbox Snap dan Status dipanggil dengan kunci palsu: keduanya
    401, bentuk galat terbaca parser — PASS
  - Uji sandbox sungguhan (`npm run test:sandbox`, pesanan
    `UJI-1790477305694` Rp 324.300): sesi Snap dibuat termasuk diskon negatif
    PASS; dibayar BCA VA di simulator → `settlement` PASS; handler webhook
    dengan status API asli → dikonfirmasi sekali, notifikasi ulang
    `sudah-diproses`, signature palsu 401 — PASS
  - Kanal QRIS/Mandiri, `expire` sungguhan, dan notifikasi lewat internet ke
    route handler: NOT_RUN (baru BCA VA dicoba; aplikasi belum ada)
- Catatan: menyimpang dari PRD §21 atas permintaan pemilik proyek; perlu
  persetujuan A1 dan pembimbing (D9).

### 2026-09-25 — Persiapan konfigurasi kerja
- Branch / PR: commit awal langsung di `main` (repo baru dibuat), lalu `develop`
  dicabang dari commit yang sama
- Perubahan: menyiapkan `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`,
  `CONTRIBUTING.md`, template PR, `.env.example`, `.gitignore`,
  `.gitattributes`, `.editorconfig`, dokumen `docs/` (status, glosarium,
  keputusan terbuka, uji mandiri, demo, runbooks), 7 skill + 5 agent + hook
  SessionStart di `.claude/`, workflow di `.agents/`, kerangka tes E2E di
  `tests/e2e/`. Diadaptasi dari setup proyek salesapp, disesuaikan ke stack
  Next.js + Prisma.
- Verifikasi:
  - Hook SessionStart dijalankan (dengan dan tanpa hook global): PASS
  - JSON `.claude/settings.json`, `.claude/launch.json` valid: PASS
  - Harness E2E (di salinan sementara dengan Playwright 1.63): `tsc --strict`
    PASS; `--list` 40 tes; semua ter-skip saat halaman `belumAda`; smoke test ke
    server HTML mini membuktikan deteksi axe, gulir mendatar, jumlah `<h1>`,
    error JS, tombol < 44 px, dan redirect `/masuk?next=`: PASS
  - `.gitignore` pada repo sementara (`.env*`, dump SQL, sesi E2E, unggahan
    diabaikan; `.env.example`, migration SQL tetap terlacak): PASS
  - Tautan relatif di Markdown: PASS (69 tautan)
  - Kode aplikasi: NOT_RUN (belum ada)
- Catatan: DESIGN.md mengoreksi kombinasi warna PRD §17 yang gagal WCAG AA.
  Keputusan yang belum diambil dicatat di `OPEN_DECISIONS.md`.
