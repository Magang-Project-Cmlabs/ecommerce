// Hitungan ongkos kirim TokoKita (PRD §10.3, KONTRAK_CHECKOUT.md §4, D19).
// Fungsi murni tanpa ketergantungan Prisma, aman dipanggil di client maupun server.
//
// D19: tarif reguler per kg dibedakan menurut zona provinsi tujuan (asal toko di Jawa).
// Tarif adalah perkiraan toko, bukan tarif resmi ekspedisi. Zona Jawa memakai tarif
// lama PRD (JNE Rp 15.000, SiCepat Rp 13.000 per kg).

import { kotaSamaDenganToko, zonaProvinsi, type Zona } from './wilayah';

export type KurirKode = 'jne_reg' | 'sicepat_reg' | 'gosend_instant';
type KurirReguler = Exclude<KurirKode, 'gosend_instant'>;

export type TujuanPengiriman = { kota: string; provinsi: string };

export type OpsiPengiriman = {
  method: KurirKode;
  label: string;
  estimate: string;
  cost: number;
  available: boolean;
  reason: string | null;
};

export const TARIF_KURIR = {
  jne_reg: { label: 'JNE Regular' },
  sicepat_reg: { label: 'SiCepat REG' },
  gosend_instant: {
    label: 'GoSend Instant',
    estimate: '1-2 jam',
    tarifFlat: 30_000,
    maxBeratGram: 20_000, // 20 kg
  },
} as const;

type Tarif = { tarifPerKg: number; estimate: string };

/** Tarif reguler per kg dan estimasi tiba, per zona tujuan dan kurir (D19). */
export const TARIF_ZONA: Record<Zona, Record<KurirReguler, Tarif>> = {
  jawa: { jne_reg: { tarifPerKg: 15_000, estimate: '2-3 hari' }, sicepat_reg: { tarifPerKg: 13_000, estimate: '1-2 hari' } },
  sumatra: { jne_reg: { tarifPerKg: 22_000, estimate: '3-5 hari' }, sicepat_reg: { tarifPerKg: 19_000, estimate: '2-4 hari' } },
  bali_nusra: { jne_reg: { tarifPerKg: 24_000, estimate: '3-4 hari' }, sicepat_reg: { tarifPerKg: 21_000, estimate: '2-4 hari' } },
  kalimantan: { jne_reg: { tarifPerKg: 30_000, estimate: '4-6 hari' }, sicepat_reg: { tarifPerKg: 26_000, estimate: '3-5 hari' } },
  sulawesi: { jne_reg: { tarifPerKg: 32_000, estimate: '4-6 hari' }, sicepat_reg: { tarifPerKg: 28_000, estimate: '3-5 hari' } },
  maluku_papua: { jne_reg: { tarifPerKg: 58_000, estimate: '5-9 hari' }, sicepat_reg: { tarifPerKg: 52_000, estimate: '5-8 hari' } },
};

export const KOTA_TOKO_DEFAULT = 'Jakarta';
const ALASAN_PROVINSI = 'Provinsi alamat tidak dikenali. Ubah alamat dan pilih provinsi dari daftar.';

/**
 * Konversi berat dalam gram ke kg pembulatan ke atas, dengan batas minimum 1 kg.
 * kg = max(1, ceil(totalBeratGram / 1000))
 */
export function hitungBeratKg(totalBeratGram: number): number {
  if (totalBeratGram <= 0) return 1;
  return Math.max(1, Math.ceil(totalBeratGram / 1000));
}

/**
 * Cek kelayakan kurir GoSend Instant:
 * 1. Kota alamat sama dengan kota toko (termasuk wilayah administratifnya, mis. "Jakarta Selatan").
 * 2. Total berat <= 20.000 gram (20 kg).
 */
export function cekKelayakanGoSend(
  totalBeratGram: number,
  kotaTujuan: string,
  kotaToko: string = process.env.STORE_CITY || KOTA_TOKO_DEFAULT
): { available: boolean; reason: string | null } {
  if (!kotaSamaDenganToko(kotaTujuan, kotaToko)) {
    return { available: false, reason: `Hanya tersedia untuk pengiriman dalam kota ${kotaToko}` };
  }
  if (totalBeratGram > TARIF_KURIR.gosend_instant.maxBeratGram) {
    return { available: false, reason: 'Berat melebihi batas maksimal GoSend (20 kg)' };
  }
  return { available: true, reason: null };
}

/**
 * Hitung tarif ongkir kurir spesifik dalam INT rupiah.
 * Mengembalikan null jika metode tidak tersedia untuk rute/kondisi tersebut.
 */
export function hitungOngkir(
  method: KurirKode,
  totalBeratGram: number,
  tujuan: TujuanPengiriman,
  kotaToko: string = process.env.STORE_CITY || KOTA_TOKO_DEFAULT
): number | null {
  const opsi = hitungOpsiPengiriman(totalBeratGram, tujuan, kotaToko).find((o) => o.method === method);
  return opsi?.available ? opsi.cost : null;
}

/**
 * Menghasilkan seluruh opsi kurir beserta status ketersediaan dan estimasi biaya (KONTRAK_CHECKOUT §4).
 */
export function hitungOpsiPengiriman(
  totalBeratGram: number,
  tujuan: TujuanPengiriman,
  kotaToko: string = process.env.STORE_CITY || KOTA_TOKO_DEFAULT
): OpsiPengiriman[] {
  const kg = hitungBeratKg(totalBeratGram);
  const zona = zonaProvinsi(tujuan.provinsi);
  const reguler = (method: KurirReguler): OpsiPengiriman => {
    if (!zona) return { method, label: TARIF_KURIR[method].label, estimate: '-', cost: 0, available: false, reason: ALASAN_PROVINSI };
    const tarif = TARIF_ZONA[zona][method];
    return { method, label: TARIF_KURIR[method].label, estimate: tarif.estimate, cost: tarif.tarifPerKg * kg, available: true, reason: null };
  };
  const kelayakanGoSend = cekKelayakanGoSend(totalBeratGram, tujuan.kota, kotaToko);

  return [
    reguler('jne_reg'),
    reguler('sicepat_reg'),
    {
      method: 'gosend_instant',
      label: TARIF_KURIR.gosend_instant.label,
      estimate: TARIF_KURIR.gosend_instant.estimate,
      cost: TARIF_KURIR.gosend_instant.tarifFlat,
      available: kelayakanGoSend.available,
      reason: kelayakanGoSend.reason,
    },
  ];
}
