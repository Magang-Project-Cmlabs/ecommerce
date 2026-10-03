// Wilayah tujuan pengiriman (D19): 38 provinsi Indonesia dan zona tarif ongkir.
// Fungsi murni tanpa Prisma, aman dipakai di client (formulir alamat) maupun server.

export type Zona = 'jawa' | 'bali_nusra' | 'sumatra' | 'kalimantan' | 'sulawesi' | 'maluku_papua';

const PROVINSI_PER_ZONA: Record<Zona, readonly string[]> = {
  sumatra: ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Lampung'],
  jawa: ['Banten', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur'],
  bali_nusra: ['Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur'],
  kalimantan: ['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara'],
  sulawesi: ['Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara'],
  maluku_papua: ['Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Tengah', 'Papua Pegunungan', 'Papua Selatan'],
};

export const LABEL_ZONA: Record<Zona, string> = {
  jawa: 'Jawa',
  bali_nusra: 'Bali & Nusa Tenggara',
  sumatra: 'Sumatra',
  kalimantan: 'Kalimantan',
  sulawesi: 'Sulawesi',
  maluku_papua: 'Maluku & Papua',
};

/** 38 provinsi, urut barat ke timur; dipakai sebagai pilihan di formulir alamat. */
export const DAFTAR_PROVINSI: readonly string[] = (['sumatra', 'jawa', 'bali_nusra', 'kalimantan', 'sulawesi', 'maluku_papua'] as const)
  .flatMap((zona) => PROVINSI_PER_ZONA[zona]);

const sederhanakan = (teks: string) => teks.toLowerCase().replace(/[.,]/g, ' ').replace(/^\s*provinsi\s+/, '').replace(/\s+/g, ' ').trim()
  .replace(/sumatra/g, 'sumatera');

const ALIAS: Record<string, string> = {
  jakarta: 'DKI Jakarta', dki: 'DKI Jakarta', 'daerah khusus jakarta': 'DKI Jakarta', 'dki jakarta raya': 'DKI Jakarta',
  'daerah khusus ibukota jakarta': 'DKI Jakarta',
  yogyakarta: 'DI Yogyakarta', jogja: 'DI Yogyakarta', jogjakarta: 'DI Yogyakarta', diy: 'DI Yogyakarta', 'd i yogyakarta': 'DI Yogyakarta',
  'daerah istimewa yogyakarta': 'DI Yogyakarta',
  jabar: 'Jawa Barat', jateng: 'Jawa Tengah', jatim: 'Jawa Timur',
  sumut: 'Sumatera Utara', sumbar: 'Sumatera Barat', sumsel: 'Sumatera Selatan', kepri: 'Kepulauan Riau',
  babel: 'Kepulauan Bangka Belitung', 'bangka belitung': 'Kepulauan Bangka Belitung', ntb: 'Nusa Tenggara Barat', ntt: 'Nusa Tenggara Timur',
  kalbar: 'Kalimantan Barat', kalteng: 'Kalimantan Tengah', kalsel: 'Kalimantan Selatan', kaltim: 'Kalimantan Timur', kaltara: 'Kalimantan Utara',
  sulut: 'Sulawesi Utara', sulteng: 'Sulawesi Tengah', sulbar: 'Sulawesi Barat', sulsel: 'Sulawesi Selatan', sultra: 'Sulawesi Tenggara',
  malut: 'Maluku Utara', 'nanggroe aceh darussalam': 'Aceh',
};

const BAKU = new Map<string, string>([
  ...DAFTAR_PROVINSI.map((p) => [sederhanakan(p), p] as const),
  ...Object.entries(ALIAS).map(([alias, p]) => [sederhanakan(alias), p] as const),
]);

/** Nama provinsi baku dari isian bebas/lama; null bila tidak dikenal (tidak menebak). */
export function provinsiBaku(isian: string): string | null {
  return BAKU.get(sederhanakan(isian ?? '')) ?? null;
}

export function zonaProvinsi(isian: string): Zona | null {
  const baku = provinsiBaku(isian);
  if (!baku) return null;
  return (Object.keys(PROVINSI_PER_ZONA) as Zona[]).find((zona) => PROVINSI_PER_ZONA[zona].includes(baku)) ?? null;
}

const normalKota = (kota: string) => kota.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^(kota|kabupaten|kab\.?)\s+/, '');

/** Kota tujuan sama dengan kota toko, termasuk wilayah administratifnya ("Jakarta Selatan" untuk toko "Jakarta"). */
export function kotaSamaDenganToko(kotaTujuan: string, kotaToko: string): boolean {
  const tujuan = normalKota(kotaTujuan ?? ''), toko = normalKota(kotaToko ?? '');
  if (!tujuan || !toko) return false;
  return tujuan === toko || tujuan.startsWith(`${toko} `);
}
