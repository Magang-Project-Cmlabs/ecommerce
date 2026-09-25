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
