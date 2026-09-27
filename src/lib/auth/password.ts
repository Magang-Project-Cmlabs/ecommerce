// Hash password dengan bcrypt (PRD §13). Cost 10 sama dengan prisma/seed.ts.

import bcrypt from 'bcryptjs';

const COST = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function cocokkanPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// Hash acak yang tidak cocok dengan password apa pun yang mungkin diketik.
let hashPalsu: string | undefined;

/**
 * Dipakai saat email tidak terdaftar: tetap menjalankan bcrypt supaya waktu
 * respons sama dengan "password salah", sehingga daftar akun tidak bisa ditebak
 * dari lamanya respons. Selalu false.
 */
export async function cocokkanPasswordPalsu(password: string): Promise<false> {
  hashPalsu ??= await bcrypt.hash(`tokokita-palsu-${Math.random()}`, COST);
  await bcrypt.compare(password, hashPalsu);
  return false;
}
