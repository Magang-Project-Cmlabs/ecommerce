# `.agents/` — Konfigurasi Agent untuk TokoKita

Folder ini untuk AI coding assistant selain Claude Code (Google Antigravity,
Codex, Cursor). Isinya **penunjuk**, bukan salinan: aturan kanonik ada di
[`../CLAUDE.md`](../CLAUDE.md) dan prosedur rinci di `../.claude/skills/`.
Dengan begitu aturan hanya ditulis sekali dan tidak saling berselisih.

## Struktur

```
.agents/
├── README.md                     ← berkas ini
├── rules/
│   └── tokokita.md               ← aturan proyek (menunjuk ke CLAUDE.md)
└── workflows/
    ├── tokokita-mulai-sesi.md    ← orientasi awal sesi
    ├── tokokita-akses-data.md    ← query, transaksi, migration
    ├── tokokita-pesanan.md       ← stok, promo, ongkir, status pesanan
    ├── tokokita-ui.md            ← halaman dan komponen
    ├── tokokita-verifikasi.md    ← gerbang verifikasi sebelum PR
    └── tokokita-perbarui-status.md ← pembaruan dokumen status
```

## Dokumen rujukan utama

- [`../docs/MULAI_DI_SINI.md`](../docs/MULAI_DI_SINI.md) — orientasi cepat
- [`../docs/PROJECT_STATUS.md`](../docs/PROJECT_STATUS.md) — kondisi terkini
- [`../docs/PRD - E-Commerce.md`](../docs/PRD%20-%20E-Commerce.md) — spesifikasi produk
- [`../docs/runbooks/local-setup.md`](../docs/runbooks/local-setup.md) — setup lokal
