# Backup dan Pemulihan Database Produksi

Paket gratis Aiven tidak menjanjikan retensi backup, jadi TokoKita membuat
salinan sendiri setiap hari lewat GitHub Actions di repo pribadi
`kvnlhm/ecommerce` (branch default `sinkron`, workflow `backup-db.yml`).

## Cara kerja

- Jadwal: setiap hari 01.37 WIB (`37 18 * * *` UTC); bisa dipicu manual lewat
  `gh workflow run backup-db.yml -R kvnlhm/ecommerce`.
- Koneksi TLS dengan verifikasi CA Aiven, memakai pengguna MySQL khusus baca
  `tokokita_backup` (hak `SELECT, SHOW VIEW, TRIGGER, LOCK TABLES` pada database toko saja).
- `mysqldump --single-transaction` → gzip → enkripsi AES-256 (gpg, kunci `BACKUP_KUNCI`).
  Dump ditolak bila tidak lengkap atau tabelnya kurang dari 16.
- Disimpan sebagai artifact `backup-tokokita-<run id>` selama 30 hari.

Pemasangan (sekali, oleh pemilik): `node scripts/pasang-otomasi-github.mjs`.
Skrip membuat `.env.otomasi` (Git-ignored) berisi `BACKUP_KUNCI`, pengguna
backup, dan `CRON_SECRET`, lalu mengisi secret GitHub dan `CRON_SECRET` Vercel.
**Tanpa `BACKUP_KUNCI`, backup tidak bisa dibuka** — simpan salinan `.env.otomasi`
di tempat aman (mis. pengelola kata sandi).

## Memulihkan

Selalu pulihkan ke database **terpisah** dulu, periksa, baru putuskan.

```bash
# 1. Unduh backup terbaru
gh run list -R kvnlhm/ecommerce -w backup-db.yml -L 5
gh run download <run-id> -R kvnlhm/ecommerce -D backup-unduh

# 2. Buka kunci (gpg menanyakan BACKUP_KUNCI dari .env.otomasi)
gpg -d backup-unduh/*/tokokita-*.sql.gz.gpg | gunzip > pulih.sql

# 3. Impor ke database lokal terpisah
mysql -u root -e "CREATE DATABASE tokokita_pulih CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root tokokita_pulih < pulih.sql
```

Periksa jumlah produk, pengguna, dan pesanan di `tokokita_pulih`. Mengembalikan
ke Aiven produksi adalah tindakan destruktif: lakukan hanya atas keputusan
pemilik, saat situs sepi, dan buat backup baru sebelum menimpa.

Hapus `pulih.sql` dan folder unduhan setelah selesai; jangan pernah di-commit.

## Pesanan otomatis (terpasang bersama)

Workflow `pesanan-otomatis.yml` di branch yang sama memanggil
`/api/cron/orders` produksi setiap jam (menit ke-23) dengan secret `CRON_SECRET`.
Cron harian Vercel tetap ada sebagai cadangan.
