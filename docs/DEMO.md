# Naskah Demo — TokoKita (± 7 menit)

Sumber: Presentasi slide 21 (Demo & rilis), kartu *A5 · Hari 6 · Siapkan dan latih demo 7 menit*.

## Persiapan (sebelum demo, bukan saat demo)

- [ ] `npm run db:reset` → data demo segar (PRD §20)
- [ ] Jalankan mode production: `npm run build && npm run start`
- [ ] Dua jendela browser: pembeli (`demo@tokokita.id`) dan admin
      (`admin@tokokita.id`), keduanya sudah login
- [ ] Satu pesanan contoh sudah lewat batas bayar (dari seed atau dengan
      memanggil job cron — lihat OPEN_DECISIONS D7)
- [ ] Email pesanan bisa ditunjukkan (kotak masuk atau konsol/Mailpit)
- [ ] Layar HP / emulasi perangkat siap untuk menunjukkan tampilan mobile

## Skenario

| Menit | Adegan | Yang ditunjukkan |
|---|---|---|
| 0:00 | Pembuka | Beranda di HP: banner, kategori, produk terlaris |
| 0:45 | 1. Cari & pilih | Ketik 2 huruf → saran; filter; detail produk; pilih varian (harga & stok berubah, varian habis terkunci) |
| 2:00 | 2. Checkout | Keranjang **minimal Rp 100.000** (mis. 2 Kaos Polos) → kode promo `HEMAT10` → 4 langkah → halaman sukses dengan nomor pesanan & batas bayar |
| 3:30 | 3. Admin | Dasbor (pesanan hari ini, stok menipis) → konfirmasi pembayaran → Dikemas → input resi → Dikirim |
| 5:00 | 4. Pembeli menerima | Timeline status → "Pesanan Diterima" → beri ulasan (badge Pembeli Terverifikasi) |
| 6:00 | 5. Batal otomatis | Pesanan lewat batas bayar jadi Dibatalkan; stok dan kuota promo kembali |
| 6:30 | Bonus (opsional) | Tombol bulan → mode gelap; "Tanya AI": "Metode pembayaran apa saja?" lalu "Buatkan kode Python" (ditolak sopan) |
| 6:45 | Penutup | Kriteria sukses yang tercapai |

## Kalau ada yang gagal saat demo

Jangan memperbaiki kode di depan penonton. Pindah ke adegan berikutnya dan
jelaskan singkat. Siapkan rekaman layar cadangan dari latihan terakhir.

## Status kesiapan (3 Okt 2026)

| Adegan | Status | Bukti / catatan |
|---|---|---|
| 1. Cari & pilih varian | Siap | E2E katalog PASS; pilih varian mengubah stok, varian habis terkunci (dicek di browser) |
| 2. Checkout + `HEMAT10` | Siap (belanja ≥ Rp 100.000) | Seed lama memakai HEMAT10 untuk akun demo (batas 1/pengguna) sehingga adegan gagal; kini pesanan lama itu memakai ONGKIRFREE. DB online `tokokita_preview` sudah di-seed ulang. Lokal: perlu `db:reset` (minta persetujuan) |
| 3. Admin konfirmasi bayar + resi | Siap | E2E admin "konfirmasi bayar, kemas, kirim dengan resi" PASS (3 Okt, alur pilihan + modal baru). Midtrans sandbox aktif online; konfirmasi manual admin tetap jalan sebagai cadangan |
| 4. Pembeli terima + ulasan | Siap | E2E commerce PASS |
| 5. Batal otomatis 24 jam | Siap di lokal | Seed punya 1 pesanan lewat batas; picu `node scripts/run-orders-cron.mjs` (butuh `APP_URL`, `CRON_SECRET`). Online hanya cron harian 00.00 WIB |
| Bonus: mode gelap + Tanya AI | Siap | E2E asisten + axe terang/gelap PASS; jawaban online diuji 3 Okt |

PPT 3 Okt sudah sesuai aplikasi (Midtrans sandbox, Vercel + Aiven, Vercel Blob, Gmail SMTP,
Argon2id, Tanya AI). Yang perlu disebut jujur: QRIS sandbox gagal di simulator, cron 15 menit
belum terjadwal online, dan backup Aiven baru manual.

## Latihan otomatis dan rekaman cadangan

Kelima adegan dijalankan otomatis oleh `tests/e2e/specs/demo-ppt.spec.ts` (opt-in,
menulis data; hanya ke DB uji `ecommerce_verifikasi_*`):

```powershell
$env:E2E_BASE_URL = 'http://localhost:3002'; $env:E2E_DEMO = '1'
npx playwright test --config tests/e2e/playwright.config.ts demo-ppt.spec.ts --project=desktop
```

Hasil 1 Okt 2026: **PASS** (30 dtk); belum diulang setelah admin pindah ke modal (3 Okt, `NOT_RUN`). Pendaftaran pembeli baru, saran pencarian, pilih
varian, HEMAT10 (diskon Rp 17.800 dari Rp 178.000), 4 langkah checkout, admin
Dikonfirmasi → Dikemas → Dikirim dengan resi, pembeli terima + ulasan, dan pesanan
lewat batas dibatalkan oleh `/api/cron/orders`. Tangkapan layar tiap langkah
(15 berkas) ada di [`docs/screenshots/demo-ppt/`](screenshots/demo-ppt/) sebagai
cadangan bila demo langsung gagal.

Temuan latihan: HEMAT10 punya minimal belanja Rp 100.000; satu Kaos Polos (Rp 89.000)
ditolak dengan pesan yang benar. Pakai 2 barang saat demo.
