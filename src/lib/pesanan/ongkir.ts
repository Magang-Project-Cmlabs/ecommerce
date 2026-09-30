// Hitungan ongkos kirim TokoKita (PRD §10.3, KONTRAK_CHECKOUT.md §4).
// Fungsi murni tanpa ketergantungan Prisma, aman dipanggil di client maupun server.

export type KurirKode = 'jne_reg' | 'sicepat_reg' | 'gosend_instant';

export type OpsiPengiriman = {
  method: KurirKode;
  label: string;
  estimate: string;
  cost: number;
  available: boolean;
  reason: string | null;
};

export const TARIF_KURIR = {
  jne_reg: {
    label: 'JNE Regular',
    estimate: '2-3 hari',
    tarifPerKg: 15_000,
  },
  sicepat_reg: {
    label: 'SiCepat REG',
    estimate: '1-2 hari',
    tarifPerKg: 13_000,
  },
  gosend_instant: {
    label: 'GoSend Instant',
    estimate: '1-2 jam',
    tarifFlat: 30_000,
    maxBeratGram: 20_000, // 20 kg
  },
} as const;

export const KOTA_TOKO_DEFAULT = 'Jakarta';

/**
 * Normalisasi nama kota untuk perbandingan tidak peka huruf besar/spasi (PRD §10.3).
 */
export function normalisasiKota(kota: string): string {
  return kota.trim().toLowerCase().replace(/\s+/g, ' ');
}

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
 * 1. Kota alamat sama dengan kota toko (case & whitespace insensitive).
 * 2. Total berat <= 20.000 gram (20 kg).
 */
export function cekKelayakanGoSend(
  totalBeratGram: number,
  kotaTujuan: string,
  kotaToko: string = process.env.STORE_CITY || KOTA_TOKO_DEFAULT
): { available: boolean; reason: string | null } {
  const normTujuan = normalisasiKota(kotaTujuan);
  const normToko = normalisasiKota(kotaToko);

  // Periksa kesamaan kota terlebih dahulu
  if (!normTujuan || normTujuan !== normToko) {
    return {
      available: false,
      reason: `Hanya tersedia untuk pengiriman dalam kota ${kotaToko}`,
    };
  }

  // Periksa batas berat maksimal 20 kg
  if (totalBeratGram > TARIF_KURIR.gosend_instant.maxBeratGram) {
    return {
      available: false,
      reason: 'Berat melebihi batas maksimal GoSend (20 kg)',
    };
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
  kotaTujuan: string = '',
  kotaToko: string = process.env.STORE_CITY || KOTA_TOKO_DEFAULT
): number | null {
  const kg = hitungBeratKg(totalBeratGram);

  switch (method) {
    case 'jne_reg':
      return TARIF_KURIR.jne_reg.tarifPerKg * kg;
    case 'sicepat_reg':
      return TARIF_KURIR.sicepat_reg.tarifPerKg * kg;
    case 'gosend_instant': {
      const kelayakan = cekKelayakanGoSend(totalBeratGram, kotaTujuan, kotaToko);
      if (!kelayakan.available) return null;
      return TARIF_KURIR.gosend_instant.tarifFlat;
    }
  }
}

/**
 * Menghasilkan seluruh opsi kurir beserta status ketersediaan dan estimasi biaya (KONTRAK_CHECKOUT §4).
 */
export function hitungOpsiPengiriman(
  totalBeratGram: number,
  kotaTujuan: string,
  kotaToko: string = process.env.STORE_CITY || KOTA_TOKO_DEFAULT
): OpsiPengiriman[] {
  const kg = hitungBeratKg(totalBeratGram);
  const kelayakanGoSend = cekKelayakanGoSend(totalBeratGram, kotaTujuan, kotaToko);

  return [
    {
      method: 'jne_reg',
      label: TARIF_KURIR.jne_reg.label,
      estimate: TARIF_KURIR.jne_reg.estimate,
      cost: TARIF_KURIR.jne_reg.tarifPerKg * kg,
      available: true,
      reason: null,
    },
    {
      method: 'sicepat_reg',
      label: TARIF_KURIR.sicepat_reg.label,
      estimate: TARIF_KURIR.sicepat_reg.estimate,
      cost: TARIF_KURIR.sicepat_reg.tarifPerKg * kg,
      available: true,
      reason: null,
    },
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

