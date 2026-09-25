# TokoKita — instruksi untuk AI agent

Berkas ini untuk agent selain Claude Code (Codex, Cursor, Google Antigravity).
Instruksi kanonik ada di [`CLAUDE.md`](CLAUDE.md): stack, struktur, aturan keras,
alur kerja tim, dan standar verifikasi. Baca berkas itu dulu, lalu
[`docs/MULAI_DI_SINI.md`](docs/MULAI_DI_SINI.md).

Prosedur rinci (orientasi, akses data, aturan pesanan, UI, verifikasi, pembaruan
status) ada di `.claude/skills/*/SKILL.md` dan bisa dibaca sebagai dokumen biasa.
Workflow ringkas untuk Antigravity ada di `.agents/workflows/`.

Status verifikasi hanya boleh `PASS`, `FAIL`, atau `NOT_RUN` (dengan alasan).
