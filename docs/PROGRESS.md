# Log Pekerjaan — TokoKita

Catatan per sesi kerja, **terbaru di atas**. Tulis singkat: apa yang dikerjakan,
berkas yang disentuh, dan hasil verifikasi (`PASS` / `FAIL` / `NOT_RUN`).

Format entri:

```markdown
### YYYY-MM-DD — <anggota> — <judul kartu / ringkasan>
- Branch / PR: feat/... / #nomor
- Perubahan: ...
- Verifikasi: typecheck PASS · lint PASS · test NOT_RUN (alasan) · ...
- Catatan / keputusan: ...
```

---

### 2026-10-03 — Kevin Ilham / Claude Code — Catatan resi demo
- Pemilik mengecek resi `SCP108158466` (pesanan seed INV-202609-0014) di sicepat.com: "Nomor resi tidak ditemukan". Penyebab: `prisma/seed.ts` membuat resi acak, bukan resi kiriman nyata; tombol "Cek di situs kurir" tetap bekerja (membuka situs resmi + menyalin resi).
- Dokumen diperjelas: PROJECT_STATUS (hasil lacak paket sungguhan NOT_RUN), SERAH_TERIMA, runbook login-google-dan-lacak-resi, catatan pembicara PPT slide 5. Kode tidak berubah.

### 2026-10-03 — Kevin Ilham / Claude Code — Rilis fitur lanjutan D19–D21 ke produksi
- Atas permintaan pemilik (sebelum akhir sesi): migration `20261003150000_login_google` diterapkan ke Aiven produksi lebih dulu, lalu PR #62 di-merge ke `develop` dan dicerminkan; deploy produksi Ready.
- Verifikasi produksi: halaman utama/katalog/masuk/daftar/kebijakan/syarat 200 · tombol "Masuk dengan Google" tampil · `/api/auth/google` 307 ke Google dengan redirect produksi, PKCE S256, state, nonce, cookie `Secure; HttpOnly; SameSite=lax` · callback state palsu → `/masuk?galat=google` · cron tanpa kunci 401 · admin pesanan Dikirim menampilkan "Cek di situs SiCepat". Login Google penuh di produksi NOT_RUN (sudah PASS di localhost dengan akun asli; tidak membuat akun produksi baru tanpa perlu).
- Perbaikan kecil: label kurir di detail pesanan admin memakai `TARIF_KURIR` ("SiCepat REG", bukan "SICEPAT REG").
- PPT dan dokumen diperbarui (aturan akhir sesi).

### 2026-10-03 — Kevin Ilham / Claude Code — Tombol gratis "Cek di situs kurir"
- Pengganti lacak otomatis yang berbayar: `src/lib/pengiriman/tautan-kurir.ts` + komponen `TautanLacakKurir` di detail pesanan pembeli dan admin. JNE → `https://www.jne.co.id/tracking-package` (dicek HTTP 200; formulir POST + token, jadi resi disalin otomatis), SiCepat → `https://www.sicepat.com/` (`/checkAwb` kini dialihkan ke beranda yang memuat Cek Resi), GoSend tanpa tautan. Uji manual di jne.co.id (3 Okt): setelah resi dimasukkan, detail baru tampil setelah 5 digit terakhir telepon penerima diisi, jadi tombol JNE kini memberi petunjuk itu. Tab baru dengan `rel="noopener noreferrer"`. Tanpa biaya dan tanpa API.
- Verifikasi: unit PASS (tautan kurir) · E2E commerce + admin + aksesibilitas desktop/HP PASS (18; tautan JNE, target, rel diperiksa) · klik di browser lokal membuka situs SiCepat di tab baru dan clipboard berisi resi · typecheck PASS · lint PASS.

### 2026-10-03 — Kevin Ilham / Claude Code — Google OAuth dipublikasikan; Binderbyte ternyata berbayar
- Google Cloud (via Chrome, akses pemilik): Branding dilengkapi (beranda, kebijakan privasi, syarat, domain) lalu **Publish app → In production** (tanpa logo, izin dasar; tidak perlu verifikasi).
- BinderHub (akun pemilik sudah login): API Cek Resi 15 kredit/hit (Rp 15), isi ulang minimal Rp 5.000, hanya Production; saldo 0. Kunci tidak dibuat dan saldo tidak diisi (aturan pemilik: tanpa pembayaran uang asli). Lacak resi tetap nonaktif sampai pemilik memutuskan.

### 2026-10-03 — Kevin Ilham / Claude Code — Google Cloud OAuth disiapkan; uji Login Google sungguhan (lokal)
- Lewat Claude in Chrome (akses dari pemilik): project Google Cloud TokoKita (`tokokita-510509`), layar persetujuan External (centang User Data Policy oleh pemilik), OAuth Client Web "TokoKita Web" dengan redirect URI produksi + localhost:3000, test user email pemilik. Client secret tidak dibaca Claude; pemilik menempelnya di `.env.google` dan memasang ke Vercel (OK semua).
- Uji sungguhan di localhost:3000 (izin eksplisit pemilik): Masuk dengan Google → pilih akun → layar izin (nama, foto, email) → Lanjutkan → kembali ke TokoKita dengan sapaan "Halo, Kevin Ilham". DB lokal: akun pembeli lama dengan email yang sama ditautkan (`google_sub` terisi) dan password lamanya diganti hash Argon2id acak sesuai perbaikan keamanan. PASS.
- Catatan: peringatan hydration di mode dev berasal dari atribut sisipan ekstensi browser (`bis_register`, `bis_skin_checked`), bukan dari aplikasi. Publish app menunggu halaman Branding dilengkapi (saat rilis).

### 2026-10-03 — Kevin Ilham / Claude Code — Fitur lanjutan: ongkir per zona, lacak resi, Login Google (branch, belum di-merge)
- Branch / PR: `feat/lanjutan-ongkir-resi-google` / PR ke `develop` **ditahan sampai setelah presentasi** (keputusan pemilik). Ketiga fitur tercantum "Di Luar Cakupan" PRD §21; dibuka pemilik (D19–D21).
- Perubahan: (D19) zona tarif per provinsi tujuan (`wilayah.ts`, `TARIF_ZONA`), pilihan 38 provinsi yang bisa dicari di formulir alamat, validasi nama baku, pengetahuan asisten AI ikut zona; (D20) lacak resi Binderbyte (`src/lib/pengiriman/lacak.ts`, aksi `lacakPesanan`, komponen `LacakPaket` di detail pesanan pembeli & admin, status kurir umum diterjemahkan); (D21) Login Google (route `/api/auth/google` + callback, `google.ts`, `masukAtauDaftarGoogle`, kolom `users.google_sub` lewat migration baru, tombol di masuk/daftar, pesan galat); `.env.example`, skrip pemasang env (grup google/lacak), runbook, audit keamanan, CLAUDE.md aturan 5.
- Verifikasi: unit PASS (tes baru wilayah, ongkir zona, lacak, Google, callback, aksi lacak) · integrasi MySQL Google PASS (4) · migration lokal + DB uji PASS, `prisma migrate diff` tanpa selisih · E2E commerce + akun PASS (10, termasuk ongkir zona Bali) · lacak paket diuji di browser lokal dengan server tiruan Binderbyte (riwayat tampil) · Login Google lokal dengan konfigurasi tiruan: 307 ke Google dengan PKCE/state/nonce, cookie httpOnly, callback state palsu ditolak · login Google sungguhan dan lacak resi asli NOT_RUN (menunggu kunci pemilik) · migration produksi NOT_RUN (setelah presentasi). Tinjauan agen security-reviewer: 1 Tinggi (pra-pembajakan lewat penautan email → password lama kini diganti saat penautan), 1 Sedang (callback tanpa batas + Argon2 di muka → batas 20/15 menit per IP, hash malas), 1 Rendah (alamat API lacak → hanya HTTPS/localhost); ketiganya diperbaiki dengan tes; 0 Kritis.

### 2026-10-03 — Kevin Ilham / Claude Code — Generator PPT masuk repo; PPT diperbarui akhir sesi
- Aturan baru pemilik: setiap akhir sesi perbarui semua dokumentasi **dan PPT** (CLAUDE.md, skill `tokokita-perbarui-status`).
- Generator PPT dipindah dari folder sementara ke `scripts/ppt/` (bangun.cjs, aset/, skrip tangkapan layar, render.ps1, README; `pptxgenjs` dipasang di folder itu saja, bukan dependensi aplikasi; `applyTheme` dari skill lokal opsional lewat `PPTX_APPLY_THEME`).
- PPT diperbarui: slide 7 (cron tiap jam + backup harian), 18 (475 unit, 87 E2E, LCP katalog 2,3 / detail 2,2 dtk), 20 (backup otomatis berjalan), 21 (bayar sandbox diuji di produksi, email di latar, gambar lama ikut terhapus).
- Verifikasi: validator PPTX PASS · render PowerPoint 22 slide, slide 7/18/20/21 diperiksa · lint PASS (scripts/ppt diabaikan ESLint).

### 2026-10-03 — Kevin Ilham / Claude Code — Merapikan pesanan uji produksi
- Lewat sesi admin yang di-login pemilik: INV-202610-0001 "Batalkan dan kembalikan pembayaran" → Dibatalkan · Dikembalikan (sandbox); stok Kabel USB-C kembali 62 (HTML publik). Admin juga menampilkan "Metode: Transfer Bank BCA".
- Setelah email dijadwalkan lewat `after()`: log Vercel produksi untuk aksi itu tanpa galat. Durasi respons persis NOT_RUN (log CLI tidak memuat durasi; pengukur di browser tidak menangkap karena tombol dirender ulang); bukti perbaikan ada di tes unit/integrasi.

### 2026-10-03 — Kevin Ilham / Claude Code — Email pesanan tidak lagi menahan respons
- Penyebab halaman sukses lambat (±5–10 detik di produksi): `buatPesanan` dan `ubahStatus` menunggu `kirimNotifikasiPesanan` (Gmail SMTP) sebelum menjawab. Kini lewat `jadwalkanNotifikasiPesanan` (`src/lib/pesanan/jadwal-notifikasi.ts`, `after()` dari Next) seperti email lupa password; berlaku juga untuk webhook Midtrans, cron, dan aksi admin. Di luar request (tes/skrip) email dijalankan tanpa ditunggu.
- Verifikasi: unit PASS (475 + 2 dilewati; tes baru jadwal email) · integrasi MySQL PASS (30; tes SMTP loopback kini menunggu email tiba dan tetap memastikan pesanan sudah commit saat email dikirim) · E2E commerce + admin PASS (6) · typecheck PASS · lint PASS · waktu pengalihan di produksi: lihat entri berikutnya.

### 2026-10-03 — Pemilik — Ganti password akun demo dan uji email lupa password
- Pemilik mengganti password akun admin dan pembeli demo di produksi (sempat tertulis di percakapan) dan menguji email "Lupa password" dari situs produksi: aman (dilaporkan pemilik, tidak diulang Claude).

### 2026-10-03 — Kevin Ilham / Claude Code — Cek nama Snap dan layar pengalihan di produksi
- Pemilik mengganti Display Name di menu Snap Checkout (dashboard Midtrans sandbox). Pesanan uji INV-202610-0002 (Kabel USB-C, BCA): selama pengalihan hanya tampil "Pesanan berhasil dibuat" (tanpa layar keranjang kosong) · halaman Snap menampilkan "TokoKita" · pesanan dibatalkan pembeli, status Dibatalkan, stok kembali ke 61 (62 − 1 pesanan lunas INV-202610-0001).
- Catatan: pindah ke halaman sukses setelah "Buat Pesanan" memakan ±8–10 detik pada percobaan ini (±5 detik sebelumnya); belum diselidiki.

### 2026-10-03 — Kevin Ilham / Claude Code — Uji produksi: hapus gambar dan bayar sandbox; perbaikan temuan
- Uji produksi (Claude in Chrome, sesi yang di-login pemilik, tanpa mengetik password): (1) admin menambah foto ke "Kabel USB-C Anyaman 1 m", file Blob HTTP 200; foto dilepas dan disimpan, file Blob HTTP 404 (dengan/tanpa parameter), foto demo tetap 200, produk kembali 3 foto. (2) Pembeli checkout 1 Kabel USB-C + JNE Regular + BCA (Rp 64.000) → INV-202610-0001 → Snap sandbox → simulator BCA VA "Simulated payment is successful" → tanpa menekan Cek Pembayaran status menjadi Dikonfirmasi · Lunas (webhook produksi bekerja). Pesanan uji dibiarkan; stok kabel berkurang 1.
- Temuan dan perbaikan: setelah "Buat Pesanan" layar sempat menampilkan "Keranjang masih kosong" sebelum pindah halaman → kini menampilkan "Pesanan berhasil dibuat… Membuka halaman pesanan"; detail pesanan pembeli dan admin menampilkan kode mentah "bank bca" → label dari satu sumber `LABEL_METODE_PEMBAYARAN` (`src/lib/pesanan/status.ts`). Catatan pemilik: nama merchant Snap "sijoki" (dashboard Midtrans).
- Verifikasi: E2E commerce baru FAIL pada kode lama (layar kosong terdeteksi), PASS setelah perbaikan · E2E penuh PASS (87, 1 dilewati) · unit PASS (473 + 2 dilewati) · typecheck PASS · lint PASS.

### 2026-10-03 — Kevin Ilham / Claude Code — Hapus file gambar lama dan tombol tampilkan password
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop`.
- Perubahan: (1) foto yang dilepas saat edit produk, gambar banner/kategori yang diganti, dan gambar banner/kategori yang dihapus kini ikut dihapus dari penyimpanan (Vercel Blob `POST /delete`, S3 `DELETE` bertanda tangan, atau berkas lokal) lewat `after()` setelah data tersimpan. Hanya `uploads/<uuid>.webp` milik aplikasi dan hanya bila tidak lagi dirujuk produk, kategori, banner, atau `order_items`; foto demo tidak disentuh; kegagalan hanya dicatat. Produk yang diarsipkan tetap menyimpan fotonya (bisa diaktifkan lagi). (2) Tombol tampilkan/sembunyikan password di formulir masuk, daftar, dan reset password (komponen `KolomIsian`); tab akun sudah punya.
- Verifikasi: unit PASS (471 + 2 dilewati; tes baru untuk kunci unggahan, Blob/S3/lokal, dan pemeriksaan pemakaian) · E2E akun/admin/lupa password/penjaga/batasi PASS (32) · tes hapus file FAIL tanpa fitur, PASS dengan fitur · aksesibilitas + responsif desktop/HP PASS (22) · typecheck PASS · lint PASS.

### 2026-10-03 — Kevin Ilham / Claude Code — Uji unggah gambar admin di produksi
- Cara: Claude in Chrome memakai sesi admin yang di-login pemilik (tanpa mengetik password). Produk "Kabel USB-C Anyaman 1 m": tambah 1 foto (salinan foto demo produk itu), simpan, lalu hapus lagi dan simpan.
- Verifikasi: "Produk berhasil disimpan" · halaman publik memuat URL `*.public.blob.vercel-storage.com/uploads/…webp` dengan HTTP 200 `image/webp` 15 KB · setelah dihapus halaman publik kembali ke 3 foto demo, 0 URL Blob · file Blob tidak dihapus aplikasi (perilaku yang ada, 15 KB).

### 2026-10-03 — Kevin Ilham / Claude Code — Kerangka admin tersembunyi bagi pembeli
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop`.
- Temuan (uji produksi lewat Chrome dengan sesi pembeli yang di-login pemilik): `/admin/*` menolak dengan 404 dan tanpa data, tetapi layout tetap menampilkan sidebar, sapaan, dan tombol admin. Tes E2E penjaga masih mencari nama navigasi lama "Menu admin" sehingga lulus tanpa memeriksa.
- Perubahan: layout admin hanya merender kerangka untuk role admin (keputusan akses tetap `requireAdmin` di page); tes memeriksa "Navigasi admin", tombol "Menu admin", dan sapaan.
- Verifikasi: tes baru FAIL pada layout lama, PASS setelah perbaikan · E2E auth-guard + admin + aksesibilitas PASS (21) · typecheck PASS · lint PASS · unit penjaga halaman PASS · unggah gambar online lewat browser NOT_RUN (sesi admin tidak ada; formulir ulasan mengunggah saat ulasan diterbitkan, jadi tidak dipakai).

### 2026-10-03 — Kevin Ilham / Claude Code — LCP seluler: font judul tanpa preload
- Branch / PR: `feat/penyelesaian-tokokita` / PR #52 ke `develop`.
- Perubahan: `Albert_Sans` (judul) `preload: false`; font isi Inter tetap dipreload. Di jaringan seluler kedua font (80 KB) berebut bandwidth dengan foto LCP.
- Verifikasi: Lighthouse lokal throttling devtools, median 3 run: katalog LCP 2.327 → 2.165 ms, detail 2.205 → 2.102 ms, CLS 0 → 0 · typecheck PASS · lint PASS · unit PASS (459 + 2 dilewati) · build PASS · E2E NOT_RUN (perubahan hanya pemuatan font).

### 2026-10-03 — Kevin Ilham / Claude Code — Otomasi pesanan dan backup
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop`.
- Perubahan: `scripts/pasang-otomasi-github.mjs` (CRON_SECRET baru di Vercel + GitHub, pengguna MySQL khusus baca `tokokita_backup`, kunci backup di `.env.otomasi`); workflow `pesanan-otomatis.yml` (tiap jam) dan `backup-db.yml` (harian, gpg AES-256, artifact 30 hari) untuk branch `sinkron` repo pribadi; runbook backup-restore. Cache dev E2E (`.sandbox/next-e2e`) yang basi setelah pindah `shadcn` dibersihkan.
- Verifikasi: skrip pemasang dijalankan pemilik — semua langkah OK · E2E lokal `E2E_MIDTRANS_SANDBOX` BCA PASS, Mandiri PASS, QRIS FAIL (simulator) · latihan demo `E2E_DEMO` PASS · workflow dikirim pemilik ke `sinkron`; run manual pertama: pesanan otomatis PASS (HTTP 200, 0 gagal), backup PASS (17 tabel, 26 KB, artifact 30 hari) · uji buka backup NOT_RUN (butuh kunci pemilik).

### 2026-10-03 — Kevin Ilham / Claude Code — Dokumentasi akhir dan PPT baru
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop` (di-merge sendiri atas instruksi pemilik).
- Perubahan: PPT dibangun ulang (22 slide, tema monokrom "TokoKita Monokrom" sesuai web, tangkapan layar terang/gelap/admin modal/Tanya AI, catatan pembicara, angka verifikasi terbaru); `PROJECT_STATUS` ditulis ulang sebagai potret 3 Okt; MULAI_DI_SINI, SERAH_TERIMA, DEMO, runbook deployment (variabel Blob/asisten), audit keamanan (bagian asisten AI), indeks dokumentasi, README diperbarui; `shadcn` (CLI) dipindah ke devDependencies karena advisori `braces` tanpa versi tambalan.
- Verifikasi: typecheck PASS · lint PASS · unit PASS (459 + 2 dilewati) · integrasi PASS (30) · prisma validate PASS · build PASS · E2E PASS (86 + 1 dilewati) · `npm audit --omit=dev` PASS (0) · PPT: validator PASS, render PowerPoint 22/22 diperiksa · latihan demo `E2E_DEMO` NOT_RUN (opt-in, menulis data).

### 2026-10-03 — Kevin Ilham / Claude Code — Pengaman asisten AI
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop` (di-merge sendiri atas instruksi pemilik).
- Perubahan: instruksi sistem membatasi topik (daftar topik ditolak, kalimat penolakan tetap `PENOLAKAN_TOPIK`, larangan kode/SQL, data toko ditandai bukan instruksi, pengingat di akhir); pembatas berlapis per pengguna/IP + harian + global; batas total riwayat 6.000 karakter; jawaban maks. 800 token tanpa `tools`; cache jawaban pertanyaan pembuka 1 jam; tombol darurat `ASISTEN_NONAKTIF`.
- Verifikasi: typecheck PASS · lint PASS · unit PASS (459 + 2 dilewati) · uji langsung penyalahgunaan 16/16 PASS (Gemini dan Groq) · catatan: Groq gratis ~1.700+ token per pertanyaan sehingga hanya beberapa pertanyaan per menit (cadangan saja).

### 2026-10-03 — Kevin Ilham / Claude Code — Penyedia AI cadangan (Groq)
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop` (di-merge sendiri atas instruksi pemilik).
- Perubahan: `daftarPenyedia` (utama Gemini + cadangan Groq dari `ASISTEN_CADANGAN_*`), `mintaJawaban` berpindah penyedia saat kunci ditolak/kuota habis dengan batas 4 panggilan & 30 detik; tombol tampil bila salah satu kunci ada; `pasang-env-vercel.mjs` menerima kunci cadangan dan menolak kunci berspasi; `.env.example`, D18, SERAH_TERIMA diperbarui.
- Insiden kecil: saat menguji validasi skrip, sebuah nilai uji (bukan kunci asli) sempat terpasang sebagai `ASISTEN_CADANGAN_API_KEY` di Vercel Preview + Production karena pemeriksaan spasi salah tulis; nilai itu langsung dihapus (`vercel env rm`, dicek dengan `vercel env ls`), tidak ada deploy yang memakainya, dan pemeriksaannya diperbaiki serta diuji tanpa memanggil Vercel.
- Verifikasi: typecheck PASS · lint PASS · test asisten PASS (28) · kunci Groq pemilik diuji langsung: `llama-3.3-70b-versatile` sudah tidak tersedia (404), bawaan diganti `openai/gpt-oss-120b` + `qwen/qwen3.8-27b`; keduanya menjawab dengan instruksi asisten asli (0,5–1,1 s), menolak permintaan kode promo rahasia/.env · tautan markdown dari model kini dirender aman (hanya halaman toko yang bisa diklik).

### 2026-10-03 — Kevin Ilham / Claude Code — Pilihan bisa dicari, lencana status, asisten AI, performa
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop` (di-merge sendiri atas instruksi pemilik).
- Perubahan: `Pilihan` dibangun ulang di atas Popover dengan kotak cari (pilihan > 6) dan pola ARIA combobox/listbox; `Lencana`/`LencanaStatus`/`LencanaPembayaran` menggantikan lencana berwarna penuh di admin dan pesanan pembeli; asisten "Tanya AI" (D18: Server Action `tanyaAsisten`, Gemini API lewat fetch, data publik saja, penyaring + penyamaran data sensitif, batas 15/10 menit per IP, panel dimuat saat dibuka); `catatBatasAuthDb` menerima batas khusus; foto slide hero tambahan ditunda; favicon kecil + icon.svg; label logo toko/admin sesuai teks terlihat; placeholder harga dipersingkat; `.env.example` + `pasang-env-vercel.mjs` mendukung `ASISTEN_*`.
- Verifikasi: typecheck PASS · lint PASS · test PASS (447 + 2 dilewati) · build PASS · e2e Chrome PASS (86, 1 dilewati) · axe terang/gelap (pilihan + asisten terbuka) PASS · Lighthouse lokal sebelum/sesudah dicatat di PROJECT_STATUS · jawaban AI sungguhan PASS di produksi setelah pemilik memasang kunci Gemini (5 pertanyaan uji, termasuk 2 upaya membocorkan rahasia yang ditolak; AI Gateway tidak dipakai karena HTTP 403 wajib kartu) · lintas browser NOT_RUN.

### 2026-10-03 — Kevin Ilham / Claude Code — Admin bergaya toko, modal tambah/edit, Pilihan kustom, konfirmasi keluar, Argon2id
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop` (di-merge sendiri atas instruksi pemilik).
- Perubahan: komponen `Pilihan` menggantikan 12 `<select>` bawaan (filter katalog, urutan, ulasan, form dan filter admin; subkategori menjorok di bawah induk); `Input` 44 px `rounded-xl`; dialog bersama (`Dialog`, `AlertDialog`) bergaya baru; `TombolKeluar` meminta konfirmasi di toko dan admin; admin: sidebar terang/gelap dengan menu pil, judul besar, kartu ubin, tabel lega, tambah/edit produk/kategori/promo/banner lewat `ModalAdmin` (`?tambah=1`/`?edit=ID`, rute lama dialihkan); password Argon2id `@node-rs/argon2` (D17) dengan migrasi diam-diam hash bcrypt saat login, batas 128 byte, seed Argon2id; dokumen (CLAUDE.md, DESIGN.md, OPEN_DECISIONS D17, PRD catatan, runbook, panduan agent/skill, UJI_MANDIRI, SERAH_TERIMA, README E2E) dan PPT (slide 10, 11, 12, 13, 17) diperbarui.
- Verifikasi: typecheck PASS · lint PASS · test PASS (423 + 2 dilewati) · integrasi auth MySQL PASS (12) · build PASS · e2e Chrome PASS (83, 1 dilewati) · axe terang/gelap admin + modal + katalog PASS · validator PPTX PASS · render PPT NOT_RUN (LibreOffice tidak tersedia) · lintas browser NOT_RUN.

### 2026-10-03 — Kevin Ilham / Claude Code — Redesain gaya Framer + mode gelap
- Branch / PR: `feat/penyelesaian-tokokita` / PR ke `develop` (di-merge sendiri atas instruksi pemilik).
- Perubahan: palet monokrom terang/gelap (D16) dengan merah hanya untuk diskon; font judul Albert Sans; tombol mode gelap di toko dan admin (tanpa kilatan, tersimpan di perangkat); header baru (pita pengumuman berjalan, menu tengah, menu HP); hero foto penuh dengan judul besar; ubin kategori bento berfoto; kartu produk 4:5 dengan tombol bulat; ulasan kutipan besar; pita teks besar; baris jaminan; footer hitam dengan merek besar; judul halaman dalam diseragamkan; sisa warna oranye/abu diganti token. Foto banner/kategori CC0 baru (KREDIT_FOTO); `demo:ilustrasi` tidak lagi menimpa banner/kategori tanpa bendera. DESIGN.md ditulis ulang.
- Verifikasi: typecheck PASS · lint PASS · test PASS (418) · build PASS · e2e Chrome PASS (aksesibilitas, navigasi, katalog, akun, responsif 360 px, admin, transaksi, ulasan, lupa password: 59 + 83 kasus, 1 dilewati) · axe mode gelap + terang 7 halaman PASS (0 pelanggaran serius) · tangkapan layar terang/gelap desktop + HP diperiksa · lintas browser NOT_RUN (tidak diminta untuk perubahan ini) · PPT belum diganti ke tampilan baru NOT_RUN.

### 2026-10-02 — Kevin Ilham / Claude Code — Redesain toko dan admin, dokumentasi dan PPT diperbarui
- Branch / PR: `feat/penyelesaian-tokokita` / #27–#38 di-merge ke `develop` (tanpa 2 reviewer, atas instruksi pemilik; mohon ditinjau ketua tim).
- Perubahan: bagian "Kata pembeli" dari ulasan nyata; hero scroll-snap dan gerak CSS; arah visual Apple Store (ubin abu muda, kartu tanpa bingkai, hero dua kolom); sistem tombol baru dan penyeragaman oranye kustom; aksi admin ikon + tulisan; halaman dalam (detail, checkout, akun, pesanan) disamakan; admin beraksen oranye. Unggah gambar lewat Vercel Blob (D15); SMTP Gmail terpasang; foto produk CC0 + KREDIT_FOTO; latihan demo otomatis. Dokumen: DESIGN.md ditulis ulang, PPT diperbarui (26 teks + 4 gambar), README/indeks/CLAUDE.md disesuaikan.
- Verifikasi: lint PASS · typecheck PASS · test PASS (418) · e2e Chrome subset PASS (78 kasus) · suite lintas browser 299/310 lalu 28/28 setelah isi ulang stok data uji · Lighthouse produksi: desktop 100, seluler 91–92 (LCP 2,9–3,1 s FAIL terhadap 2,5 s) · validator PPTX PASS · render PPT NOT_RUN · uji bayar sandbox di situs online NOT_RUN.
- Catatan: pemilik menilai sebagian tampilan masih belum sesuai acuan dan meminta contoh lebih konkret; QRIS sandbox tetap FAIL (simulator 2603).

### 2026-10-01 — Kevin Ilham / Claude Code — Rilis Vercel, Midtrans sandbox online, polesan UI dan latihan demo
- Branch / PR: `feat/penyelesaian-tokokita` / #23 dan #25 di-merge ke `develop` (tanpa 2 reviewer, atas instruksi pemilik; mohon ditinjau ketua tim).
- Perubahan: Preview Vercel diperbaiki (env DB per lingkungan, DB uji `tokokita_preview`); produksi publik dari `develop`; kunci Midtrans sandbox + Notification URL; cron harian Vercel; akun admin/pembeli online dengan kata sandi acak. UI: tema tombol orange-700 putih, ikon kategori, judul tab, admin (bilah atas sendiri, sidebar penuh, ringkasan, kategori berjenjang, pemilih gambar Indonesia, tombol detail/kembali), login admin langsung ke panel, beranda tanpa produk berulang, tab bergaris bawah. Foto produk CC0 sesuai produk (docs/KREDIT_FOTO.md). Seed: akun demo tidak lagi memakai HEMAT10. Latihan demo otomatis `demo-ppt.spec.ts`.
- Verifikasi: typecheck PASS · lint PASS · test PASS (409) · e2e subset Chrome/Android PASS · latihan demo 5 adegan PASS · CI PASS (#23, #25) · produksi online PASS (HTTP, guard admin, webhook 401) · Lighthouse online FAIL (LCP seluler 2,9–3,7 s) · bayar sandbox online sampai lunas NOT_RUN (butuh pembeli login) · R2/SMTP NOT_RUN (akun belum ada).
- Catatan: QRIS sandbox tetap FAIL (simulator 2603). Merge tanpa review dan push cermin `develop` memakai `IZINKAN_PUSH_LANGSUNG=1` hanya untuk isi yang sudah di-merge.

### 2026-10-01 — Kevin Ilham / Codex — Penghentian sementara dan serah terima ke Claude Code
- Pemilik meminta berhenti untuk menghemat token Codex. Goal dipause dan runner browser/server QA dihentikan; demo lokal 3000 tetap tersedia.
- Branch / PR: `feat/penyelesaian-tokokita` / #23 draft. Commit terakhir pushed `984d01f`; perubahan terbaru tersimpan lokal, belum commit/push.
- Perubahan: query katalog paralel, Suspense beranda, lazy validasi ulasan, perbaikan hydration pencarian/wishlist, penjagaan attempt pembayaran dalam row lock, fixture dan suite lintas browser/sandbox. Rincian dan langkah lanjut di SERAH_TERIMA.
- Verifikasi PASS: typecheck, lint, 403 unit, 30 integrasi MySQL, build 31 route; 24 regresi Firefox/WebKit; pembayaran BCA/Mandiri sampai DB dan webhook lokal idempoten.
- QRIS FAIL: simulator resmi error 2603 meski QR URL/PNG valid. Suite final 310 NOT_RUN sampai selesai: dihentikan setelah 89 kasus lulus. Performa terbaru, rilis cloud dan CI perubahan lokal belum selesai; tidak dinyatakan 100%.

### 2026-10-01 — Kevin Ilham / Codex — Pemeriksaan akhir CI dan preview Vercel
- Branch / PR: `feat/penyelesaian-tokokita` / [#23](https://github.com/Magang-Project-Cmlabs/ecommerce/pull/23), draft.
- CI PASS: run 36839552818 pada commit 8d8696a, kedua job berhasil. Working tree bersih sebelum pembaruan status ini.
- Preview Vercel FAIL: integrasi Git repo pribadi membangun commit 1acd7c2, deployment `dpl_9g2dyzipY6uL8Q46t1iAhoH1yXxD` gagal. GitHub tidak menampilkan penyebab; pembacaan log CLI memerlukan login Vercel yang belum tersedia.
- Production terbaru NOT_RUN; layanan eksternal/performa tetap mengikuti batas pada PROJECT_STATUS. Tidak mengubah production atau menjalankan tes mutasi pada Aiven.

### 2026-10-01 — Kevin Ilham / Codex — Integrasi TokoKita sesuai PPT dan Vercel + Aiven
- Branch / PR: `feat/penyelesaian-tokokita`, integrasi `develop@1fb10162` dan `feature@2d01e28`; [PR #23](https://github.com/Magang-Project-Cmlabs/ecommerce/pull/23) ke `develop`.
- Temuan awal: pekerjaan A3 sudah berlanjut pada `feature`. Implementasi itu diteruskan, termasuk akun, alamat dan komponen checkout; tidak mengubah kepemilikan kartu tim.
- Perubahan: katalog/galeri/filter/search/wishlist/ulasan, checkout server dengan stok dan promo atomik, akun dan anonimisasi, riwayat/timeline serta seluruh admin produk/kategori/promo/banner/pesanan. Midtrans, webhook, cron dan email tersambung ke transisi tunggal.
- Keamanan: JWT versi password, pembatas MySQL bersama, unggah satu file bertoken, proteksi edit stok usang, penolakan konversi varian saat pesanan nonvarian aktif, pembersihan PII catatan pembatalan, reset dibatasi sebelum bcrypt, foto ulasan terikat item eligible dan kuota bersama. Audit read-only diikuti tes regresi; tidak ada temuan tersisa.
- Infrastruktur: pemilik mengganti VPS dengan Vercel + Aiven. TLS CA ketat dan wrapper migration, tiga migration tanpa reset toko; 87 foto seed lokal, storage S3/R2 production, workflow cron eksternal tersedia. Dependency audit nol kerentanan.
- Verifikasi: `npm ci` PASS; typecheck PASS; lint PASS; unit PASS (392); integrasi MySQL PASS (28); Prisma validate PASS; build PASS; E2E PASS (83/83 tanpa skip); Snap sandbox create PASS; TLS/migration Aiven PASS; backup TLS dan restore DB terpisah PASS (26 produk, 14 pengguna, 79 pesanan, 188 ulasan, tiga migration).
- CI awal: job 28 integrasi MySQL PASS; build FAIL karena APP_URL production belum disediakan oleh fixture CI. Tambahkan domain placeholder HTTPS pada workflow; CI ulang [36839184299](https://github.com/Magang-Project-Cmlabs/ecommerce/actions/runs/36839184299) PASS untuk dua job (commit 1acd7c2).
- Batas: deployment terbaru/SMTP eksternal/S3 bucket/jadwal cron online NOT_RUN karena akses/environment belum tersedia. Settlement sesi baru NOT_RUN. Target performa belum semuanya PASS; hasil aktual ada di `PROJECT_STATUS.md`. Tes lokal tidak membuktikan kesiapan hosting.
- Status dan runbook diperbarui; tidak menjalankan reset pada database toko lokal maupun Aiven.


### 2026-09-30 — Kevin Ilham — Kontrak data checkout & pesanan
- Branch / PR: `docs/kontrak-checkout` → PR ke `develop`
- Pemicu: A4 menanyakan field checkout/order untuk skema validasi agar sama
  dengan UI A3. Belum ada yang ditetapkan.
- Perubahan: `docs/KONTRAK_CHECKOUT.md` (item keranjang, alamat, pratinjau,
  input/hasil `buatPesanan`, isi `orders`, halaman sukses), **berlaku** sebagai
  acuan A3 + A4; D13 diputuskan (batas quantity/baris/catatan, alamat terpisah,
  rute sukses); entri di `DOCUMENTATION_INDEX.md`.
- Temuan: PR #17 dan #18 (`feature/header`, A2) di-merge langsung ke `main`, tidak
  lewat `develop`; `develop` tertinggal 4 commit dari `main`.
- Verifikasi: hanya dokumen; CI PR dicek sebelum merge.

### 2026-09-27 — Kevin Ilham — A1 · Cek dan gabungkan pekerjaan anggota (mulai)
- Branch / PR: `docs/review-pr-anggota` → PR ke `develop`
- Keadaan: belum ada PR maupun branch dari anggota; semua kartu A2–A5 masih
  *Rencana*. Temuan: A3 (`rizkikusnadi03`) dan A5 (`fikarnugraha18`) belum punya
  akses repo — dicatat sebagai blocker, butuh admin `azridalimunthe7`.
- Perubahan: skill `tokokita-review-pr` (prosedur cek → gerbang lokal → aturan
  keras → review GitHub → merge dengan CI hijau + 2 persetujuan), didaftarkan di
  `CLAUDE.md`; blocker akses di `PROJECT_STATUS.md` dan `SERAH_TERIMA.md`.
- Verifikasi: hanya dokumen/skill; CI PR dicek sebelum merge.

### 2026-09-27 — Kevin Ilham — Dokumen: GitHub Actions ternyata aktif
- Branch / PR: `docs/actions-aktif` → PR ke `develop`
- Temuan: Actions sudah berjalan sejak 27 Sep 2026 13.44 WIB (29 run CI, 22 run
  Aturan review), bukan mati seperti dicatat sebelumnya. CI merah sejak PR #10
  (`next build` gagal: `DATABASE_URL` kosong di CI) dan tidak terlihat karena
  status CI tidak dicek sebelum merge PR #10, #11, #13; diperbaiki di PR #14
  (placeholder `DATABASE_URL` di `ci.yml`).
- Perubahan: `CONTRIBUTING.md` bagian 3 (CI & aturan review **Aktif**, wajib cek
  ✓ sebelum merge), `SERAH_TERIMA.md`, D10, `PROJECT_STATUS.md`.
- Verifikasi: hanya dokumen; CI PR ini dicek sebelum merge.

### 2026-09-27 — Kevin Ilham — A1 · Fitur lupa password
- Branch / PR: `feat/lupa-password` → PR ke `develop`
- Perubahan: `/lupa-password` dan `/reset-password?token=` (shadcn, keadaan
  kirim/sukses/galat/link tidak berlaku, `noindex`, `referrer: no-referrer`),
  Server Action `lupaPassword`/`resetPassword`, tautan "Lupa password?" dan
  pesan sukses di `/masuk`. Token 32 byte acak, disimpan SHA-256, berlaku 1 jam,
  sekali pakai (update bersyarat dalam transaksi), token lama dibuang saat
  minta baru, jeda 1 menit per akun. Pencarian akun + kirim email lewat
  `after()` agar respons seragam. Rate limit 5/15 menit per IP untuk masuk,
  daftar, lupa password (D4 opsi A; masuk berhasil mengosongkan hitungan).
  `src/lib/email/` (Nodemailer, konsol saat dev — D6), link dari `APP_URL`.
- Keputusan baru: D11 (sesi lama belum dicabut setelah reset), D12 (rate limit
  hanya per IP). Runbook deploy: Nginx wajib `X-Real-IP`, log tanpa query.
- Review keamanan: layak digabung dengan syarat. Diperbaiki: IP tak dikenal
  tidak lagi jatuh ke satu hitungan bersama (bisa mengunci semua pengunjung),
  mode email konsol hanya untuk `development`/`test`. Dicatat: D12, log Nginx.
- Verifikasi: unit 175 PASS · typecheck/lint/build PASS · e2e 42 lulus 0 gagal
  PASS (10 skenario baru, termasuk dua tab memakai link yang sama) · uji mutasi
  (syarat sekali pakai dihapus, pengosongan hitungan dihapus) tertangkap PASS ·
  cek visual desktop di Chrome PASS

### 2026-09-27 — Kevin Ilham — A1 · Batasi halaman yang butuh login
- Branch / PR: `feat/batasi-halaman-login` → PR #11 ke `develop`; tindak lanjut review di `fix/perketat-penjaga-halaman` (PR #13)
- Perubahan: `src/proxy.ts` (cek optimistis cookie untuk `/checkout`, `/akun`,
  `/wishlist`, `/admin` → `/masuk?next=`), `src/lib/auth/rute.ts` (daftar rute,
  murni), `src/lib/auth/akses.ts` (`requireUser`/`requireAdmin` lewat
  `ambilPenggunaSaatIni()`; selain admin → 404), halaman sementara `/akun`,
  `/checkout`, `/wishlist`, `/admin` dengan penjaga terpasang, test statis yang
  mewajibkan setiap `page.tsx` terlindungi memanggil penjaga + matcher proxy
  sinkron dengan daftar rute.
- Review keamanan: layak digabung, tanpa temuan wajib. Catatan ditindaklanjuti:
  test statis kini mewajibkan penjaga di badan komponen halaman sebelum `return`
  (bukan sekadar ada di berkas); `butuhMasuk` menormalisasi percent-encoding dan
  huruf besar; keterbatasan query hilang pada redirect penjaga server dicatat di
  `akses.ts` (jalur normal tamu tetap membawa query lewat proxy).
- Verifikasi: unit 143 PASS · uji mutasi jaring pengaman (tanpa penjaga,
  admin pakai requireUser, penjaga hanya di komentar/string, penjaga di fungsi
  lain di berkas yang sama) semua tertangkap PASS · typecheck/lint/build PASS ·
  e2e 26 lulus 0 gagal PASS

### 2026-09-27 — Kevin Ilham — A1 · Fitur daftar, masuk, dan keluar akun
- Branch / PR: `feat/auth-daftar-masuk-keluar` → PR ke `develop`
- Perubahan: `/daftar` dan `/masuk` (shadcn, keadaan loading/galat per kolom/
  pesan umum, `noindex`), Server Action `daftar`/`masuk`/`keluar`, validasi Zod
  bersama (`src/lib/validations/auth.ts`, termasuk batas 72 byte bcrypt dan
  penyaring `next` anti open redirect), JWT HS256 `jose` (`src/lib/auth/token.ts`,
  bisa dipakai proxy), cookie httpOnly 30 hari (`sesi.ts`), data pengguna
  (`src/lib/data/pengguna.ts`), bar akun sementara di layout (dipindah A2 ke
  header). Gagal masuk: pesan dan lama respons sama untuk email tidak terdaftar
  dan password salah. Perbaikan font: `--font-sans` merujuk diri sendiri sejak
  scaffold sehingga semua halaman tampil serif.
- Verifikasi: unit 109 PASS (40 baru) · typecheck PASS · lint PASS · build PASS ·
  e2e 12 lulus / 0 gagal (6 skenario alur akun) PASS · cek tampilan desktop &
  360 px PASS · checklist keamanan autentikasi PASS
- Review `security-reviewer`: tidak ada temuan wajib; tiga catatan dicatat di
  OPEN_DECISIONS (pesan "email sudah terdaftar" = risiko diterima, rate limit
  juga untuk /daftar, otorisasi wajib lewat `ambilPenggunaSaatIni()`).
- Di luar cakupan (kartu lain): proxy.ts & halaman admin, lupa password, batas
  5 percobaan masuk.

### 2026-09-27 — Trello memakai akun GitHub
- Branch / PR: `docs/trello-pakai-akun` → PR ke `develop`
- Perubahan di Trello (lewat API web Trello dari sesi login pemilik proyek):
  25 kolom, 43 judul kartu, dan 5 label — A1–A5 diganti akun GitHub
  (`kvnlhm`, `azridalimunthe7`, `rizkikusnadi03`, `astroceilo`, `fikarnugraha18`).
  Dokumen `trello-board-plan.md` menyesuaikan.
- Verifikasi: uji kering 73 perubahan tanpa sisa A1–A5; uji tulis 1 kolom;
  baca ulang board setelah diterapkan: 73/73 berubah, 0 sisa A1–A5 — PASS

### 2026-09-27 — Identitas anggota A1–A5
- Branch / PR: `docs/identitas-anggota` → PR ke `develop`
- Perubahan: A1 `kvnlhm` (Database & Login, penggabung PR), A2 `azridalimunthe7`
  (**Ketua Tim** & Tampilan Katalog), A3 `rizkikusnadi03`, A4 `astroceilo`,
  A5 `fikarnugraha18`. Aturan review: 2 persetujuan = ketua tim + satu anggota.
  Label Trello ikut diganti.
- Verifikasi: hanya dokumen; tautan diperiksa.

### 2026-09-27 — Kevin Ilham — A1 · Buat database dan isi data contoh
- Branch / PR: `feat/skema-database` → PR ke `develop`
- Perubahan: `prisma/schema.prisma` 15 tabel PRD §9 (snake_case lewat `@map`,
  uang/berat Int, enum status/metode bayar/kurir, indeks PRD, relasi riwayat
  `Restrict`, 4 kolom payment D9, `users.phone` boleh kosong); migration
  `20260927072940_init`; `prisma/seed.ts` data demo PRD §20 (14 pengguna termasuk
  12 pembeli contoh sumber ulasan terverifikasi, 26 produk, 79 pesanan, 188
  ulasan); `src/lib/db.ts` klien Prisma bersama (adapter MariaDB);
  `next.config.ts` mengizinkan gambar `picsum.photos`; runner seed `tsx`.
  Database lokal `ecommerce` dibuat dengan `utf8mb4_unicode_ci`.
- Verifikasi: `prisma validate` PASS · migration diterapkan PASS · struktur
  (15 tabel, collation, tipe int, indeks PRD, FK) PASS · `db:seed` PASS · 23 cek
  aturan PRD §10 = 0 pelanggaran PASS · seed diulang identik PASS · password
  bcrypt akun demo PASS · `src/lib/db.ts` terhubung PASS · typecheck/lint/test/
  build PASS · `db:reset` rangkaian penuh PASS (dengan persetujuan pemilik proyek)
- Temuan: setelah `migrate reset`, collation bawaan database kembali ke
  `utf8mb4_0900_ai_ci` (tabel tetap `utf8mb4_unicode_ci`). Ditambah migration
  `20260927075929_kolasi_database` (`ALTER DATABASE ... utf8mb4_unicode_ci`) —
  diterapkan tanpa reset, data utuh.
- Catatan: Trello tidak bisa diubah dari sini (tanpa integrasi; board gagal
  dimuat di Chrome) — nama pemegang dicatat di `docs/trello-board-plan.md`.

### 2026-09-27 — Scaffold Next.js (A1 · Siapkan proyek awal)
- Branch / PR: `chore/scaffold-nextjs` → PR #3 (ditumpuk di atas PR #4)
- Perubahan: Next.js 16.3.6 (App Router, `src/`, Turbopack), Tailwind 4, ESLint,
  shadcn (Radix, preset Nova, paket `cn` resmi shadcn), Prisma 7.10.0 dikunci
  persis (`prisma7.config.ts`, client di `src/generated/prisma/`, adapter
  MariaDB), dependency PRD §5. Skrip `typecheck` = `next typegen && tsc`,
  `postinstall` = `prisma generate`, `db:reset` merangkai reset → generate →
  seed (Prisma 7 tidak seed otomatis). `lang="id"`, judul TokoKita. Dari 9 skill
  yang dipasang `prisma init`, 3 yang relevan disimpan sebagai folder biasa.
  Blok `nextjs-agent-rules` disisipkan `next dev` ke `AGENTS.md`.
  Runbook bagian A ditulis ulang sesuai langkah nyata (termasuk koreksi
  `_scaffold` yang ditolak npm). D1 & D2 diputuskan.
- Verifikasi (setelah `npm ci` bersih): typecheck PASS · lint PASS · test 69/69
  PASS · build PASS · `prisma validate` PASS · dev server beranda 200 PASS ·
  hook `pre-push` terpasang otomatis PASS · e2e NOT_RUN (semua halaman
  `belumAda`) · `db:reset` NOT_RUN (skema kosong)

### 2026-09-27 — Aturan review di GitHub Free (D10)
- Branch / PR: `docs/aturan-review-tanpa-proteksi` → PR #2 (hanya commit pertama
  yang ikut digabung) dan PR #4 (hook, CI, pendeteksi, pengecualian pemilik)
- Temuan: organisasi paket Free + repo private → proteksi branch dan ruleset
  ditolak GitHub (HTTP 403); akun `kvnlhm` hanya Write (admin: `azridalimunthe7`);
  PR #1 ter-merge tanpa persetujuan.
- Keputusan: tetap Free + private (D10). Pemilik proyek (`kvnlhm`) boleh merge
  tanpa persetujuan anggota lain (`PENGGABUNG_BEBAS_REVIEW`). Aturan dijaga disiplin tim dan tiga
  penjaga gratis: CI (`.github/workflows/ci.yml`), pendeteksi pelanggaran
  (`aturan-review.yml` + `.github/scripts/cek-aturan-review.mjs`), hook
  `.githooks/pre-push` (dipasang `npm install` lewat skrip `prepare`).
- Verifikasi:
  - Pendeteksi, uji lokal ke API GitHub sungguhan (DRY_RUN): PR #1 → gagal
    0/2 persetujuan; merge commit PR #1 → lolos; push langsung `e098660` →
    gagal; force push → gagal; PR ditutup tanpa merge → lolos; token salah →
    exit 2; 6 kasus hitung persetujuan — PASS
  - Hook `pre-push`: 13 kasus simulasi + `git push --dry-run` sungguhan ke
    `develop` ditolak dan ke branch lain lolos — PASS
  - Workflow di GitHub Actions: NOT_RUN — tidak ada workflow terdaftar/berjalan
    setelah push ke PR #2 (0 workflow, 0 run); kemungkinan Actions dimatikan di
    organisasi, hanya admin yang bisa memastikan. Tidak menghalangi: hook dan
    aturan manual tetap berlaku.

### 2026-09-27 — Pindah ke repo organisasi
- Branch / PR: `docs/serah-terima-repo-organisasi` → PR ke `develop`
- Perubahan: `main` dan `develop` di-push ke `Magang-Project-Cmlabs/ecommerce`
  setelah akun mendapat izin Write; remote repo sementara `kvnlhm/ecommerce`
  dilepas; `SERAH_TERIMA.md` diperbarui.
- Verifikasi: isi `main`/`develop` di GitHub sama dengan lokal (`e098660`) — PASS

### 2026-09-27 — Modul payment gateway Midtrans (sandbox)
- Branch / PR: `feat/payment-midtrans`, digabung langsung ke `main` di `kvnlhm/ecommerce` (repo sementara, tanpa PR atas permintaan pemilik proyek); `develop` lalu disamakan dengan `main`
- Perubahan: `src/lib/payment/` — adapter Midtrans Snap via `fetch` (buat sesi,
  ambil status), verifikasi `signature_key` SHA512 waktu-konstan, pemetaan
  `transaction_status` → aksi pesanan, handler webhook dengan dependensi
  disuntikkan (signature → pesanan → status diambil ulang dari API → jumlah
  cocok → transisi idempoten; bayar ulang `INV-…~n`; uang masuk untuk pesanan
  batal ditandai untuk admin). `package.json`/`tsconfig.json`/`vitest.config.ts`
  minimal untuk test. Runbook `payment-midtrans.md`, `.env.example`, D9 di
  OPEN_DECISIONS, D3 diputuskan Vitest, hook SessionStart mendeteksi scaffold
  dari dependency `next`.
- Verifikasi:
  - `npm run test`: PASS (69/69, termasuk 4 test dari temuan review keamanan)
  - Review `security-reviewer`: tanpa temuan kritis; 3 temuan pada kode diperbaiki, syarat integrasi dicatat di runbook §4e
  - `npm run typecheck`: PASS
  - Uji mutasi (cek jumlah, signature, percobaan aktif, total item dihapus satu
    per satu): tiap mutasi membuat test gagal — PASS
  - Endpoint sandbox Snap dan Status dipanggil dengan kunci palsu: keduanya
    401, bentuk galat terbaca parser — PASS
  - Uji sandbox sungguhan (`npm run test:sandbox`, pesanan
    `UJI-1790477305694` Rp 324.300): sesi Snap dibuat termasuk diskon negatif
    PASS; dibayar BCA VA di simulator → `settlement` PASS; handler webhook
    dengan status API asli → dikonfirmasi sekali, notifikasi ulang
    `sudah-diproses`, signature palsu 401 — PASS
  - Kanal QRIS/Mandiri, `expire` sungguhan, dan notifikasi lewat internet ke
    route handler: NOT_RUN (baru BCA VA dicoba; aplikasi belum ada)
- Catatan: menyimpang dari PRD §21 atas permintaan pemilik proyek; perlu
  persetujuan A1 dan pembimbing (D9).

### 2026-09-25 — Persiapan konfigurasi kerja
- Branch / PR: commit awal langsung di `main` (repo baru dibuat), lalu `develop`
  dicabang dari commit yang sama
- Perubahan: menyiapkan `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`,
  `CONTRIBUTING.md`, template PR, `.env.example`, `.gitignore`,
  `.gitattributes`, `.editorconfig`, dokumen `docs/` (status, glosarium,
  keputusan terbuka, uji mandiri, demo, runbooks), 7 skill + 5 agent + hook
  SessionStart di `.claude/`, workflow di `.agents/`, kerangka tes E2E di
  `tests/e2e/`. Diadaptasi dari setup proyek salesapp, disesuaikan ke stack
  Next.js + Prisma.
- Verifikasi:
  - Hook SessionStart dijalankan (dengan dan tanpa hook global): PASS
  - JSON `.claude/settings.json`, `.claude/launch.json` valid: PASS
  - Harness E2E (di salinan sementara dengan Playwright 1.63): `tsc --strict`
    PASS; `--list` 40 tes; semua ter-skip saat halaman `belumAda`; smoke test ke
    server HTML mini membuktikan deteksi axe, gulir mendatar, jumlah `<h1>`,
    error JS, tombol < 44 px, dan redirect `/masuk?next=`: PASS
  - `.gitignore` pada repo sementara (`.env*`, dump SQL, sesi E2E, unggahan
    diabaikan; `.env.example`, migration SQL tetap terlacak): PASS
  - Tautan relatif di Markdown: PASS (69 tautan)
  - Kode aplikasi: NOT_RUN (belum ada)
- Catatan: DESIGN.md mengoreksi kombinasi warna PRD §17 yang gagal WCAG AA.
  Keputusan yang belum diambil dicatat di `OPEN_DECISIONS.md`.
