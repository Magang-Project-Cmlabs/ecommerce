# Peta Dokumentasi — TokoKita

Gerbang ke semua dokumen proyek. Tiap fakta punya satu pemilik: kalau dua
dokumen berselisih, dokumen di kolom **Pemilik** yang benar.

## 1. Urutan membaca

**Anggota tim & AI agent baru**
1. [`MULAI_DI_SINI.md`](MULAI_DI_SINI.md) — satu halaman, baca ini dulu.
2. [`PRD - E-Commerce.md`](PRD%20-%20E-Commerce.md) — apa yang dibangun dan aturan bisnisnya.
3. [`trello-board-plan.md`](trello-board-plan.md) — siapa mengerjakan apa, kapan.
4. [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — branch, commit, Pull Request.

**Sebelum membuka PR**
1. [`UJI_MANDIRI.md`](UJI_MANDIRI.md) — cara menguji.

**Menjelang demo & rilis**
1. [`DEMO.md`](DEMO.md) — skenario demo 7 menit.
2. [`runbooks/deployment.md`](runbooks/deployment.md) — online-kan website.

## 2. Inventaris

| Dokumen | Peran | Pemilik fakta tentang |
|---|---|---|
| [`PRD - E-Commerce.md`](PRD%20-%20E-Commerce.md) | Spesifikasi | Fitur, aturan bisnis, skema DB, keamanan, desain |
| [`PRD_CHECKOUT_AKUN.md`](PRD_CHECKOUT_AKUN.md) | Spesifikasi | Detail fitur Checkout Langkah 3 & 4, Pesanan Berhasil, dan Halaman Akun |
| [`Presentasi_ECommerce_TokoKita.pptx`](Presentasi_ECommerce_TokoKita.pptx) | Spesifikasi | Pembagian peran (slide 14), alur kerja tim (slide 15), risiko |
| [`trello-board-plan.md`](trello-board-plan.md) | Rencana | Kartu per anggota, urutan Blocker |
| [`../CLAUDE.md`](../CLAUDE.md) | Konstitusi | Aturan keras, struktur, rute skill/agent |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Konstitusi | Alur Git, format commit, aturan PR |
| [`MULAI_DI_SINI.md`](MULAI_DI_SINI.md) | Peta | Orientasi cepat, jebakan |
| [`GLOSSARY.md`](GLOSSARY.md) | Peta | Istilah domain ↔ nama di DB ↔ label UI |
| [`KONTRAK_CHECKOUT.md`](KONTRAK_CHECKOUT.md) | Spesifikasi | Field input/output checkout & pesanan antara UI (A3) dan logika pesanan (A4) |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Status | Kondisi terkini, hasil verifikasi terakhir |
| [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md) | Status | Keputusan yang belum diambil |
| [`PROGRESS.md`](PROGRESS.md) | Riwayat | Log pekerjaan per sesi |
| [`SERAH_TERIMA.md`](SERAH_TERIMA.md) | Riwayat | Catatan pergantian sesi/operator |
| [`UJI_MANDIRI.md`](UJI_MANDIRI.md) | Prosedur | Pemeriksaan otomatis & manual |
| [`DEMO.md`](DEMO.md) | Prosedur | Naskah demo |

## 3. Runbooks (`runbooks/`)

| Runbook | Isi |
|---|---|
| [`local-setup.md`](runbooks/local-setup.md) | Scaffold proyek (sekali) dan menyalakan proyek di laptop |
| [`database-operations.md`](runbooks/database-operations.md) | Migration, seed, reset, backup & restore |
| [`security-audit.md`](runbooks/security-audit.md) | Checklist keamanan sebelum merge dan sebelum rilis |
| [`deployment.md`](runbooks/deployment.md) | VPS, PM2, Nginx, HTTPS, cron, backup |
| [`payment-midtrans.md`](runbooks/payment-midtrans.md) | Payment gateway Midtrans sandbox: alur, akun, cara menyambung ke aplikasi, cara menguji |

## 4. Perawatan

Menambah dokumen di `docs/`? Catat di tabel di atas beserta perannya.
Jangan membuat dokumen baru kalau faktanya sudah punya pemilik.
