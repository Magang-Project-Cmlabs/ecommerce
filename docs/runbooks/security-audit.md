# Runbook — Audit Keamanan

Checklist dari PRD §13 dan §15. Dipakai reviewer saat memeriksa PR yang
menyentuh area berisiko, dan sekali lagi sebelum rilis (Hari 6). Untuk audit
otomatis, panggil agent `security-reviewer`.

## Kapan wajib

PR yang menyentuh: login/daftar/lupa password, sesi, `proxy.ts`, server action
apa pun, checkout/pesanan/promo, upload gambar, `api/cron`, halaman admin, atau
data pribadi (alamat, telepon, email).

## Checklist

**Autentikasi & sesi**
- [ ] Password di-hash Argon2id (m=19 MiB, t=2, p=1), minimal 8 karakter, maksimal 128 byte; hash bcrypt lama diganti saat login berhasil (D17)
- [ ] Cookie sesi `httpOnly`, `sameSite=lax`, `secure` di production, 30 hari
- [ ] Pesan login gagal sama untuk "email tidak ada" dan "password salah"
- [ ] Lupa password: respons selalu sama; token disimpan sebagai hash, 1 jam,
      sekali pakai
- [ ] Rate limit 5 percobaan/15 menit per IP di login dan lupa password
- [ ] Ganti password meminta password lama

**Otorisasi**
- [ ] Setiap server action mengecek sesi di server, bukan hanya mengandalkan
      `proxy.ts`
- [ ] Data milik pembeli (alamat, pesanan, wishlist, ulasan) difilter `userId`
      sesi — bukan id dari form
- [ ] Aksi admin mengecek `role === 'admin'` di server
- [ ] `/api/cron/orders` menolak request tanpa `CRON_SECRET` yang benar

**Input & data**
- [ ] Semua input divalidasi Zod di server
- [ ] Tidak ada `$queryRawUnsafe` / SQL dirangkai dari string input
- [ ] Harga, stok, ongkir, diskon dihitung ulang di server
- [ ] `next` pada `/masuk?next=` hanya menerima path internal (diawali `/`,
      bukan `//` atau URL penuh) — cegah open redirect

**Upload**
- [ ] Tipe (JPG/PNG/WebP) dicek dari isi berkas, bukan hanya ekstensi
- [ ] Maks. 2 MB, min. 800×800 px, maks. 8 gambar per produk
- [ ] Nama berkas dibuat server (acak), bukan dari nama unggahan
- [ ] File yang dilepas dari produk, diganti, atau ikut terhapus bersama banner/kategori dihapus dari penyimpanan setelah data tersimpan, hanya bila berbentuk `uploads/<uuid>.webp` milik aplikasi dan tidak lagi dirujuk produk, kategori, banner, atau `order_items` (riwayat pesanan); foto demo tidak pernah dihapus

**Payment gateway (Midtrans)**
- [ ] `MIDTRANS_SERVER_KEY` hanya dibaca di server, tanpa prefiks `NEXT_PUBLIC_`
- [ ] Webhook memverifikasi `signature_key` lalu mengambil ulang status lewat API
- [ ] Jumlah dibayar dicocokkan dengan `grand_total` di database
- [ ] Konfirmasi/pembatalan lewat `ubahStatus()` bersyarat (notifikasi ganda aman)
- [ ] "Bayar Sekarang" hanya untuk pesanan milik pembeli sendiri yang masih pending

**Asisten AI "Tanya AI" (D18)**
- [ ] `ASISTEN_*` hanya dibaca di server; kunci tidak muncul di bundle client atau log
- [ ] Model tanpa `tools`, tanpa akses database/internet; data toko diambil dari query Prisma tetap
      (`src/lib/data/asisten.ts`) yang hanya memuat produk/kategori/promo publik
- [ ] Instruksi sistem membatasi topik ke belanja di TokoKita dan menolak dengan `PENOLAKAN_TOPIK`
      (kode/SQL, PR, esai, terjemahan, pengetahuan umum, roleplay/jailbreak)
- [ ] Pesan berisi nomor kartu, password, OTP, atau PIN ditolak di server dan disamarkan di browser
- [ ] Pembatas berlapis di `auth_rate_limits`: 20/10 menit dan 100/hari per pengguna atau IP, 1.500/hari global
- [ ] Batas ukuran: pertanyaan 600 karakter, riwayat 6.000 karakter, jawaban 800 token
- [ ] Tombol darurat `ASISTEN_NONAKTIF=1` menyembunyikan tombol dan menolak semua permintaan
- [ ] Tautan di jawaban hanya path internal toko; markdown dirender tanpa HTML mentah

**Rahasia & privasi**
- [ ] Tidak ada rahasia di kode, log, atau pesan error
- [ ] `.env` dan dump database tidak ter-commit
- [ ] Hapus akun menganonimkan data pribadi, riwayat pesanan tetap ada
- [ ] Halaman akun, checkout, admin memakai `noindex`

## Pemeriksaan cepat di terminal

```bash
git ls-files | grep -Ei '(^|/)\.env($|\.)|\.sql$|\.pem$'   # harus kosong (kecuali .env.example & migrations)
git grep -nE 'queryRawUnsafe|executeRawUnsafe'              # harus kosong
git grep -nE "(password|secret|api[_-]?key)\s*[:=]\s*['\"][^'\"]{6,}" -- ':!*.md' ':!.env.example'
```
