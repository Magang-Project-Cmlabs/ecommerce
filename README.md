# TokoKita

Toko online mandiri untuk brand/UMKM Indonesia: katalog, keranjang, checkout
4 langkah dengan ongkir berdasarkan berat, akun pelanggan, riwayat pesanan, dan
panel admin. Proyek magang kelompok (5 anggota, ± 1 minggu).

**Stack:** Next.js (App Router, TypeScript) · Prisma · MySQL · Tailwind CSS ·
shadcn/ui · Midtrans Snap (sandbox) · Vercel Blob · asisten AI (Gemini, cadangan Groq)

> Katalog, checkout, akun dan admin sudah terhubung ke MySQL dan berjalan online di
> **Vercel + Aiven**, dengan mode terang/gelap, tombol "Tanya AI", Login Google, dan ongkir per zona provinsi. Bukti verifikasi dan konfigurasi yang masih diperlukan
> ada di [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) dan
> [`deployment.md`](docs/runbooks/deployment.md).

## Demo online

| Lingkungan | Alamat | Catatan |
|---|---|---|
| Produksi (cabang `develop`) | **https://ecommerce-peach-seven-47.vercel.app** | Publik. Database Aiven `tokokita`. |
| Preview (cabang fitur) | https://ecommerce-git-feat-penyelesaian-tokokita-tes-2254s-projects.vercel.app | Perlu login Vercel. Database uji `tokokita_preview`. |

Arah visual ada di [`DESIGN.md`](DESIGN.md); PPT 22 slide (`docs/Presentasi_ECommerce_TokoKita.pptx`) memuat
tangkapan layar aplikasi yang berjalan (diperbarui 3 Okt 2026).

Vercel membangun ulang otomatis setiap ada push ke repo `kvnlhm/ecommerce`
(cermin repo organisasi). Akun admin/pembeli online tidak dicantumkan di sini;
mintalah kepada ketua tim.

## Mulai dari mana

| Kamu ingin… | Baca |
|---|---|
| Memahami produknya | [`docs/PRD - E-Commerce.md`](docs/PRD%20-%20E-Commerce.md) |
| Mulai kerja hari ini | [`docs/MULAI_DI_SINI.md`](docs/MULAI_DI_SINI.md) |
| Menyalakan proyek di laptop | [`docs/runbooks/local-setup.md`](docs/runbooks/local-setup.md) |
| Tahu tugasmu | [`docs/trello-board-plan.md`](docs/trello-board-plan.md) |
| Membuat branch, commit, dan Pull Request | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Menguji pekerjaan | [`docs/UJI_MANDIRI.md`](docs/UJI_MANDIRI.md) |
| Melihat semua dokumen | [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) |

## Akun demo (hasil seed, hanya untuk lokal)

Tercantum di PRD §20. Jangan pernah dipakai di server production.

## Untuk AI assistant

Instruksi proyek ada di [`CLAUDE.md`](CLAUDE.md) (Claude Code) dan
[`AGENTS.md`](AGENTS.md) (agent lain). Skill dan agent khusus proyek ada di
`.claude/`.
