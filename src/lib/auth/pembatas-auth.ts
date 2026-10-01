import 'server-only';

import { batasAuth, driverBatasAuth, type HasilBatasAuth } from '@/lib/auth/batas-percobaan';
import { catatBatasAuthDb, hapusBatasAuthDb } from '@/lib/data/batas-auth';

export async function catatBatasAuth(kunci: string): Promise<HasilBatasAuth> {
  return driverBatasAuth() === 'database' ? catatBatasAuthDb(kunci) : batasAuth.catat(kunci);
}

export async function hapusBatasAuth(kunci: string): Promise<void> {
  if (driverBatasAuth() === 'database') await hapusBatasAuthDb(kunci);
  else batasAuth.hapus(kunci);
}
