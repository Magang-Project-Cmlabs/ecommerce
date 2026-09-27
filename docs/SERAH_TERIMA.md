# Serah Terima — TokoKita

Diisi di **akhir sesi** oleh anggota atau AI agent yang berhenti, untuk orang
berikutnya yang melanjutkan. Timpa isinya setiap kali; riwayat ada di
[`PROGRESS.md`](PROGRESS.md).

Urutan baca awal sesi: [`MULAI_DI_SINI.md`](MULAI_DI_SINI.md) →
[`PROJECT_STATUS.md`](PROJECT_STATUS.md) → berkas ini.

---

**Tanggal:** 25 September 2026
**Oleh:** persiapan konfigurasi kerja

## Keadaan saat berhenti

| Hal | Kondisi |
|---|---|
| Branch aktif | `feat/payment-midtrans` (dari `develop`) |
| Perubahan belum di-commit | Tidak ada; branch di-push ke `kvnlhm/ecommerce` (repo sementara) |
| Server lokal | Tidak dijalankan |
| Database | Belum dibuat |

## Yang sedang dikerjakan

Modul payment gateway Midtrans selesai dan teruji, **belum tersambung** ke aplikasi
(menunggu scaffold, tabel `orders`, dan `ubahStatus()`). Langkahnya di
`runbooks/payment-midtrans.md` bagian 4.

## Langkah berikutnya

1. Jawab keputusan D1, D2, dan D9 di [`OPEN_DECISIONS.md`](OPEN_DECISIONS.md).
2. A1 menjalankan [`runbooks/local-setup.md`](runbooks/local-setup.md) bagian
   "Scaffold proyek" di branch `chore/scaffold-nextjs`, lalu PR ke `develop`.

## Peringatan untuk yang melanjutkan

- Jangan menjalankan `create-next-app` langsung di folder ini (akan menolak);
  ikuti runbook.
