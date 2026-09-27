# Runbook — Deployment

Target PRD §16: VPS Ubuntu di Indonesia, Next.js mode `standalone` dijalankan
PM2 di belakang Nginx, MySQL 8, HTTPS Let's Encrypt. Kartu: *A1 · Hari 6 ·
Online-kan website*.

> Runbook ini kerangka. Isi bagian yang ditandai `<…>` dan perbarui setelah
> deployment pertama berhasil. Setiap langkah yang mengubah server production
> dikerjakan bersama A1.

## 1. Persiapan server (sekali)

- Node.js LTS, MySQL 8, Nginx, PM2 (`npm i -g pm2`), Certbot.
- Buat database dan user MySQL khusus aplikasi (bukan `root`), hanya boleh dari
  `localhost`.
- Firewall: buka 22, 80, 443 saja. Port 3000 dan 3306 tidak dibuka ke internet.

## 2. Konfigurasi

- `next.config`: `output: 'standalone'`.
- `.env` di server berisi nilai production: `APP_URL` https, `AUTH_SECRET` dan
  `CRON_SECRET` baru (bukan dari laptop), SMTP asli, `STORAGE_DRIVER=s3`.
- `.env` hanya bisa dibaca user aplikasi (`chmod 600`).

## 3. Rilis

```bash
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
# salin public/ dan .next/static/ ke dalam .next/standalone/ (syarat mode standalone)
pm2 reload tokokita || pm2 start .next/standalone/server.js --name tokokita
```

PM2 dijalankan **satu instance** (mode fork) selama rate limit disimpan di
memori (OPEN_DECISIONS D4).

## 4. Nginx + HTTPS

- Reverse proxy `server_name <domain>` → `http://127.0.0.1:3000`.
- **Wajib** `proxy_set_header X-Real-IP $remote_addr;` di blok `location`.
  Rate limit masuk/daftar/lupa password memakai header ini sebagai IP klien
  (`src/lib/auth/ip.ts`); tanpa baris ini nilainya bisa dipalsukan klien atau
  semua pengunjung terhitung satu IP.
- `certbot --nginx -d <domain>`; cek perpanjangan otomatis dengan
  `certbot renew --dry-run`.
- `client_max_body_size` cukup untuk upload gambar: 2 MB per berkas; kalau
  8 gambar dikirim dalam satu request butuh ± `20m`. Batas body Server Actions
  di `next.config` harus disamakan (bawaannya 1 MB).

## 5. Job terjadwal

```cron
*/15 * * * * curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/orders > /dev/null
```

## 6. Backup & pemantauan

- Backup: lihat `database-operations.md` (harian 7 hari, mingguan 4 minggu,
  salin ke storage terpisah, uji restore bulanan).
- Log error: `pm2 logs tokokita`; pasang `pm2 install pm2-logrotate`.
- Uptime check halaman utama dari layanan pemantau eksternal.

## 7. Setelah rilis

- [ ] Beranda, detail produk, checkout, dan `/admin` terbuka lewat HTTPS
- [ ] Akun demo PRD §20 **tidak** ada di database production
- [ ] Email pesanan benar-benar terkirim
- [ ] Job cron tercatat berjalan
- [ ] Catat tanggal rilis dan commit di `PROJECT_STATUS.md`
