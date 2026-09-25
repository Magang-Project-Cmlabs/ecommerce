---
description: Mengerjakan checkout, kode promo, ongkir, status pesanan, job cron, atau ulasan TokoKita.
---

# Aturan Pesanan TokoKita

Versi ringkas. Prosedur lengkap: `.claude/skills/tokokita-pesanan/SKILL.md`.

1. Tulis unit test lebih dulu (ongkir, promo, transisi status).
2. Semua angka uang dihitung ulang di server dari database.
3. Status pesanan hanya berubah lewat satu fungsi transisi, bersyarat status asal, dan menulis `order_status_logs`.
4. Pembatalan mengembalikan stok dan kuota promo tepat satu kali.
