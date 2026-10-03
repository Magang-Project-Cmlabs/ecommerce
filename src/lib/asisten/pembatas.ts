import 'server-only';
import { buatPembatas, driverBatasAuth, type HasilBatasAuth } from '@/lib/auth/batas-percobaan';
import { catatBatasAuthDb } from '@/lib/data/batas-auth';

// Pembatas berlapis asisten AI (D18). Identitas = pengguna login ("u:<id>") atau IP ("ip:<ip>"),
// sehingga satu kelas yang berbagi Wi-Fi tetap bisa bertanya asal masing-masing login.
// Batas global harian menjaga kuota gratis penyedia AI tidak habis oleh satu penyalahguna.
export const BATAS_ASISTEN = {
  singkat: { maks: 20, jendelaMs: 10 * 60 * 1000 },
  harian: { maks: 100, jendelaMs: 24 * 60 * 60 * 1000 },
  global: { maks: 1500, jendelaMs: 24 * 60 * 60 * 1000 },
} as const;

export type LingkupBatas = keyof typeof BATAS_ASISTEN;
export type HasilBatasAsisten = { boleh: true } | { boleh: false; tungguDetik: number; lingkup: LingkupBatas };

const memori = {
  singkat: buatPembatas(BATAS_ASISTEN.singkat),
  harian: buatPembatas(BATAS_ASISTEN.harian),
  global: buatPembatas(BATAS_ASISTEN.global),
};

async function catat(lingkup: LingkupBatas, kunci: string): Promise<HasilBatasAuth> {
  return driverBatasAuth() === 'database' ? catatBatasAuthDb(kunci, undefined, new Date(), BATAS_ASISTEN[lingkup]) : memori[lingkup].catat(kunci);
}

/** Catat satu pertanyaan; berhenti di lapisan pertama yang penuh. */
export async function catatBatasAsisten(identitas: string): Promise<HasilBatasAsisten> {
  const lapisan: [LingkupBatas, string][] = [['singkat', `asisten:${identitas}`], ['harian', `asisten-hari:${identitas}`], ['global', 'asisten-global']];
  for (const [lingkup, kunci] of lapisan) {
    const hasil = await catat(lingkup, kunci);
    if (!hasil.boleh) return { boleh: false, tungguDetik: hasil.tungguDetik, lingkup };
  }
  return { boleh: true };
}
