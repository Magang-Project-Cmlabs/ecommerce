// Alamat IP klien untuk kunci rate limit.
//
// Production: Nginx WAJIB menulis `proxy_set_header X-Real-IP $remote_addr;`
// (docs/runbooks/deployment.md) — nilai itu menimpa isian klien sehingga tidak
// bisa dipalsukan. Tanpa X-Real-IP dipakai entri terakhir X-Forwarded-For
// (ditambahkan proxy terdekat); entri pertama bisa diisi bebas oleh klien.
//
// Tanpa keduanya hasilnya null, bukan kunci pengganti bersama: kunci bersama
// akan membuat 5 percobaan dari siapa pun mengunci SEMUA pengunjung (review
// keamanan PR #14).

const PANJANG_MAKS = 64;

export function ipKlien(headers: Headers): string | null {
  const nyata = headers.get('x-real-ip')?.trim();
  const diteruskan = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const ip = nyata || diteruskan;
  return ip ? ip.slice(0, PANJANG_MAKS) : null;
}
