# TokoKita — instruksi untuk AI agent

Berkas ini untuk agent selain Claude Code (Codex, Cursor, Google Antigravity).
Instruksi kanonik ada di [`CLAUDE.md`](CLAUDE.md): stack, struktur, aturan keras,
alur kerja tim, dan standar verifikasi. Baca berkas itu dulu, lalu
[`docs/MULAI_DI_SINI.md`](docs/MULAI_DI_SINI.md).

Prosedur rinci (orientasi, akses data, aturan pesanan, UI, verifikasi, pembaruan
status) ada di `.claude/skills/*/SKILL.md` dan bisa dibaca sebagai dokumen biasa.
Workflow ringkas untuk Antigravity ada di `.agents/workflows/`.

Status verifikasi hanya boleh `PASS`, `FAIL`, atau `NOT_RUN` (dengan alasan).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
