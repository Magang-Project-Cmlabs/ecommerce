---
description: Menjalankan gerbang verifikasi TokoKita sebelum commit atau Pull Request.
---

# Verifikasi TokoKita

Versi ringkas. Prosedur lengkap: `.claude/skills/tokokita-verifikasi/SKILL.md`.

1. `npm run typecheck` → `npm run lint` → `npm run test` → `npm run build` → `npm run e2e`.
2. Skrip yang belum ada dilaporkan `NOT_RUN` dengan alasan.
3. Pastikan `.env` dan dump SQL tidak ter-stage.
4. Tulis hasil di deskripsi PR dan `docs/PROJECT_STATUS.md`.
