---
description: Membuat atau mengubah halaman dan komponen TokoKita.
---

# UI TokoKita

Versi ringkas. Prosedur lengkap: `.claude/skills/tokokita-ui/SKILL.md`.

1. Baca `DESIGN.md`; pakai komponen shadcn di `src/components/ui/` dan token warna.
2. Warna lewat token (monokrom, mode terang + gelap); merah `bg-sale` hanya untuk diskon. Pilihan pakai `Pilihan` (bukan `<select>`), form tambah/edit admin di `ModalAdmin`, konfirmasi lewat `AlertDialog`.
3. Setiap tampilan punya loading, kosong, error, sukses, validasi, dan pending.
4. Cek di browser pada desktop dan 360 px.
