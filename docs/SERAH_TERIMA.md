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

Modul payment gateway Midtrans selesai dan teruji, **belum tersambung** ke aplikasi
(menunggu scaffold, tabel `orders`, dan `ubahStatus()`). Langkahnya di
`runbooks/payment-midtrans.md` bagian 4.

## Langkah berikutnya

1. Admin organisasi (`azridalimunthe7`): jadikan `develop` default branch.
   Proteksi branch tidak tersedia di paket Free untuk repo private — putuskan
   D10 di [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md); sementara itu aturan review
   dijaga manual sesuai [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
2. Jawab keputusan D1, D2, dan D9 di [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md).
3. A1 menjalankan [`runbooks/local-setup.md`](runbooks/local-setup.md) bagian
   "Scaffold proyek" di branch `chore/scaffold-nextjs`, lalu PR ke `develop`.

## Peringatan untuk yang melanjutkan

- Jangan menjalankan `create-next-app` langsung di folder ini (akan menolak);
  ikuti runbook.
