# Serah Terima — TokoKita

Diisi di **akhir sesi** oleh anggota atau AI agent yang berhenti, untuk orang
berikutnya yang melanjutkan. Timpa isinya setiap kali; riwayat ada di
[`PROGRESS.md`](PROGRESS.md).

Urutan baca awal sesi: [`MULAI_DI_SINI.md`](MULAI_DI_SINI.md) →
[`PROJECT_STATUS.md`](PROJECT_STATUS.md) → berkas ini.

---

**Tanggal:** 27 September 2026
**Oleh:** persiapan konfigurasi kerja + modul payment gateway

## Keadaan saat berhenti

| Hal | Kondisi |
|---|---|
| Repositori | `https://github.com/Magang-Project-Cmlabs/ecommerce` (private). Repo sementara `kvnlhm/ecommerce` tidak dipakai lagi. |
| Branch | `main` dan `develop` berisi commit yang sama (konfigurasi kerja + modul pembayaran) |
| Perubahan belum di-commit | Tidak ada |
| Server lokal | Tidak dijalankan |
| Database | Belum dibuat |

## Yang sedang dikerjakan

Scaffold Next.js selesai di branch `chore/scaffold-nextjs` (PR ke `develop`,
digabung setelah PR #2). Setelah menarik `develop`, jalankan `npm install`.


Modul payment gateway Midtrans selesai dan teruji, **belum tersambung** ke aplikasi
(menunggu scaffold, tabel `orders`, dan `ubahStatus()`). Langkahnya di
`runbooks/payment-midtrans.md` bagian 4.

## Langkah berikutnya

1. Admin organisasi (`azridalimunthe7`): jadikan `develop` default branch.
   Proteksi branch tidak dipakai (paket Free, D10); aturan review dijaga
   disiplin tim + hook `pre-push` (CI dan pendeteksi disiapkan, belum aktif karena
   GitHub Actions tampaknya mati di organisasi), lihat
   [`../CONTRIBUTING.md`](../CONTRIBUTING.md) bagian 3.
2. Setiap anggota menjalankan `npm install` setelah clone agar hook `pre-push`
   terpasang.
3. Jawab keputusan D9 (payment gateway) di [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md).
4. A1: kartu *Buat database dan isi data contoh* — 15 tabel PRD §9 di
   `prisma/schema.prisma`, migration pertama, seed PRD §20 (pasang `tsx`,
   atur `migrations.seed` di `prisma7.config.ts`).

## Peringatan untuk yang melanjutkan

- `npm run db:reset` menghapus seluruh isi database lokal; AI agent wajib
  meminta persetujuan dulu.
- `src/generated/` dibuat otomatis (`postinstall`), jangan diedit atau di-commit.
