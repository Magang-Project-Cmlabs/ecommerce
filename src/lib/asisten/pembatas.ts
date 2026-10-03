import 'server-only';
import { buatPembatas, driverBatasAuth, type HasilBatasAuth } from '@/lib/auth/batas-percobaan';
import { catatBatasAuthDb } from '@/lib/data/batas-auth';

// 15 pertanyaan per 10 menit per IP: cukup untuk bertanya wajar, menahan penyalahgunaan kredit AI.
export const BATAS_ASISTEN = { maks: 15, jendelaMs: 10 * 60 * 1000 };
const memori = buatPembatas(BATAS_ASISTEN);

export async function catatBatasAsisten(ip: string): Promise<HasilBatasAuth> {
  const kunci = `asisten:${ip}`;
  return driverBatasAuth() === 'database' ? catatBatasAuthDb(kunci, undefined, new Date(), BATAS_ASISTEN) : memori.catat(kunci);
}
