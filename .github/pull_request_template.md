## Kartu Trello

<!-- Tempel judul kartu, mis. "A3 · Hari 2 · Keranjang belanja (panel samping)" -->

## Masalah / tujuan

<!-- Apa yang dikerjakan dan kenapa. Rujuk bagian PRD bila ada, mis. PRD §10.4. -->

## Perubahan

-

## Cara menguji

1.

## Tangkapan layar

<!-- Wajib untuk perubahan tampilan: desktop dan HP (360 px). -->

## Hasil verifikasi

Tulis apa adanya: `PASS`, `FAIL`, atau `NOT_RUN` + alasan.

| Pemeriksaan | Status | Catatan |
|---|---|---|
| `npm run typecheck` | | |
| `npm run lint` | | |
| `npm run test` | | |
| `npm run build` | | |
| Cek di browser (desktop + HP) | | |
| `npm run e2e` | | |

## Checklist

- [ ] Harga, stok, dan ongkir dihitung di server (bila menyentuh transaksi)
- [ ] Input divalidasi Zod di server; akses dicek (login, pemilik data, role)
- [ ] Tampilan punya keadaan loading, kosong, dan error
- [ ] Tidak ada `.env`, kredensial, atau dump database yang ikut ter-commit
- [ ] `docs/PROGRESS.md` diperbarui
