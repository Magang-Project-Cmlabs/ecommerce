# Login Google dan Lacak Resi: Pemasangan

Fitur lanjutan D19–D21 ([keputusan](../OPEN_DECISIONS.md)). Kode ada di branch
`feat/lanjutan-ongkir-resi-google` dan **baru di-merge ke `develop` setelah presentasi**.
Kunci boleh dipasang ke Vercel sekarang. Tombol baru muncul di situs setelah kodenya
di-merge dan ter-deploy.

Tanpa kunci, kedua fitur otomatis nonaktif: tombol "Masuk dengan Google" dan
"Lacak paket" tidak tampil, dan situs berjalan seperti biasa.

---

## A. Login Google (gratis, tanpa kartu, ± 5 menit)

1. Buka https://console.cloud.google.com dan masuk dengan akun Google Anda.
2. Buat project baru, misalnya **TokoKita**.
3. Buka **Google Auth Platform** (dulu "OAuth consent screen"):
   - **Branding:** nama aplikasi `TokoKita`, email dukungan = email Anda.
   - **Audience:** pilih **External**. Selama status *Testing*, hanya email yang
     ditambahkan di **Test users** yang bisa masuk. Tambahkan email Anda. Untuk
     dibuka ke semua orang, tekan **Publish app**; izin email/profil dasar tidak perlu
     verifikasi Google.
4. Buka **Clients**, lalu **Create client**, pilih **Web application**, beri nama `TokoKita Web`.
5. Di **Authorized redirect URIs**, tambahkan:
   - `https://ecommerce-peach-seven-47.vercel.app/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (opsional, untuk uji di laptop)
6. Tekan **Create**. Salin **Client ID** dan **Client secret**.
7. Di folder proyek, buat berkas **`.env.google`** (otomatis diabaikan Git):
   ```
   GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-...."
   ```
8. Jalankan `node scripts/pasang-env-vercel.mjs .env.google`. Semua baris harus
   bertuliskan **OK terpasang**.

Aturan yang perlu diketahui:
- **Akun admin tidak bisa masuk lewat Google**, hanya email + password.
- Email yang sudah terdaftar dan sudah diverifikasi Google otomatis tertaut ke akun lama.
  **Demi keamanan, password lama akun itu diganti saat ditautkan.** Pendaftaran biasa tidak
  memverifikasi email, jadi akun itu bisa saja dibuat orang lain memakai email Anda. Untuk
  kembali masuk dengan password, atur ulang lewat **Lupa password**.
- Akun baru dari Google mendapat password acak. Kalau pemiliknya ingin mengganti
  password atau menghapus akun (keduanya meminta password lama), atur dulu password
  lewat **Lupa password**.

Status 3 Okt 2026: project Google Cloud **TokoKita** (`tokokita-510509`), OAuth Client **TokoKita Web**
dengan kedua redirect URI di atas sudah dibuat; kunci sudah terpasang di Vercel Preview + Production.
Branding sudah dilengkapi (beranda, `/kebijakan-privasi`, `/syarat-ketentuan`, domain
`ecommerce-peach-seven-47.vercel.app`) dan aplikasi sudah **Publish app → In production**: semua
pemilik akun Google bisa masuk begitu kodenya dirilis. Tanpa logo dan hanya izin dasar, jadi tidak perlu verifikasi Google.

## B. Lacak resi (Binderbyte)

> **Temuan 3 Okt 2026:** Binderbyte kini lewat BinderHub (`hub.binderbyte.com`) dan **berbayar per kredit**:
> API Cek Resi 15 kredit/hit, 1 kredit = Rp 1, isi ulang minimal 5.000 kredit (Rp 5.000); hanya environment
> Production, tanpa sandbox gratis. Saldo pemilik 0, jadi kunci **belum dibuat**. Tanpa kunci, tombol
> "Lacak paket" tidak tampil dan pembeli tetap bisa menyalin resi. Mengisi saldo adalah keputusan pemilik
> (uang asli).

Tanpa kunci pun pembeli dan admin mendapat tombol gratis **"Cek di situs JNE/SiCepat"** yang membuka
halaman lacak resmi kurir dan menyalin resi otomatis (tempel di kolom cek resi kurir).

1. Masuk ke https://hub.binderbyte.com, buat key di **API Keys** (produk API Cek Resi), salin **API key**.
   Periksa kuota paket gratisnya. **Kalau diminta pembayaran, berhenti dan kabari
   pengembang.**
2. Buat berkas **`.env.lacak`**:
   ```
   LACAK_RESI_API_KEY="...."
   ```
3. Jalankan `node scripts/pasang-env-vercel.mjs .env.lacak`.

Cara kerja: tombol **Lacak paket** muncul di detail pesanan (pembeli dan admin) untuk
pesanan JNE/SiCepat yang berstatus Dikirim atau Selesai. Hasil disimpan 30 menit agar
kuota hemat. GoSend tidak didukung API ini.

## C. Urutan rilis setelah presentasi (dikerjakan pengembang)

1. **Migration database produksi lebih dulu.** Migration ini hanya menambah kolom
   `users.google_sub`, jadi aman untuk kode lama:
   `node --env-file=.env.aiven scripts/migrate-deploy.mjs`.
   Lakukan juga untuk database Preview bila ingin menguji di Preview.
2. Merge PR branch `feat/lanjutan-ongkir-resi-google` ke `develop`, lalu salin ke repo pribadi.
3. Uji di situs online:
   - ongkir alamat luar Jawa;
   - "Masuk dengan Google";
   - "Lacak paket" pada pesanan bernomor resi asli.
4. Perbarui PPT dan contekan: ongkir per zona, Login Google, lacak resi.

Uji tanpa kunci asli di laptop: lihat entri PROGRESS 3 Okt (server tiruan Binderbyte
dan konfigurasi Google tiruan untuk memeriksa pengalihan).
