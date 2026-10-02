// Hash password dengan Argon2id (rekomendasi OWASP: m=19 MiB, t=2, p=1), keputusan D17.
// Hash bcrypt lama (`$2a$`/`$2b$`) masih bisa dipakai masuk, lalu di-hash ulang ke Argon2id
// saat login berhasil (lihat `perluHashUlang` dan action `masuk`).

import { hash, verify, type Algorithm } from '@node-rs/argon2';
import bcrypt from 'bcryptjs';

// Algorithm adalah const enum ambient (tidak bisa dibaca saat isolatedModules); 2 = Argon2id.
const ARGON2ID = 2 as Algorithm;
const OPSI = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
const AWALAN_SEKARANG = `$argon2id$v=19$m=${OPSI.memoryCost},t=${OPSI.timeCost},p=${OPSI.parallelism}$`;
const POLA_BCRYPT = /^\$2[aby]\$\d{2}\$/;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPSI);
}

export async function cocokkanPassword(password: string, hashTersimpan: string): Promise<boolean> {
  try {
    if (POLA_BCRYPT.test(hashTersimpan)) return await bcrypt.compare(password, hashTersimpan);
    if (!hashTersimpan.startsWith('$argon2')) return false;
    return await verify(hashTersimpan, password);
  } catch {
    return false;
  }
}

/** true bila hash bukan Argon2id dengan parameter saat ini (mis. bcrypt lama) dan sebaiknya diganti. */
export function perluHashUlang(hashTersimpan: string): boolean {
  return !hashTersimpan.startsWith(AWALAN_SEKARANG);
}

// Hash acak yang tidak cocok dengan password apa pun yang mungkin diketik.
let hashPalsu: Promise<string> | undefined;

/**
 * Dipakai saat email tidak terdaftar: tetap menjalankan Argon2id supaya waktu
 * respons sama dengan "password salah", sehingga daftar akun tidak bisa ditebak
 * dari lamanya respons. Selalu false.
 */
export async function cocokkanPasswordPalsu(password: string): Promise<false> {
  hashPalsu ??= hashPassword(`tokokita-palsu-${crypto.randomUUID()}`);
  await cocokkanPassword(password, await hashPalsu);
  return false;
}
