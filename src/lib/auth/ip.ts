// Alamat IP klien untuk kunci rate limit.
//
// Vercel: hanya header x-vercel-forwarded-for dari platform.
// Proxy lokal selain Vercel: X-Real-IP atau entri terakhir X-Forwarded-For;
// proxy harus menimpa nilainya dengan alamat koneksi peminta.
//
// Tanpa keduanya hasilnya null, bukan kunci pengganti bersama: kunci bersama
// akan membuat 5 percobaan dari siapa pun mengunci SEMUA pengunjung (review
// keamanan PR #14).

import { isIP } from 'node:net';

const PANJANG_MAKS = 64;

export function ipKlien(headers: Headers, env: { VERCEL?: string } = { VERCEL: process.env.VERCEL }): string | null {
  // Vercel menulis header ini sendiri. Abaikan header proxy lain yang dapat
  // ditimpa proxy tambahan: https://vercel.com/docs/headers/request-headers
  if (env.VERCEL === '1') {
    const ip = headers.get('x-vercel-forwarded-for')?.trim().toLowerCase();
    return ip && isIP(ip) ? ip : null;
  }
  const nyata = headers.get('x-real-ip')?.trim();
  const diteruskan = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const ip = nyata || diteruskan;
  return ip ? ip.slice(0, PANJANG_MAKS) : null;
}
