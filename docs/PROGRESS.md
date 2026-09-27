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

### 2026-09-27 — Modul payment gateway Midtrans (sandbox)
- Branch / PR: `feat/payment-midtrans`, digabung langsung ke `main` di `kvnlhm/ecommerce` (repo sementara, tanpa PR atas permintaan pemilik proyek); `develop` belum menyusul
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
