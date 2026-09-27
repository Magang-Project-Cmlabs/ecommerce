// Alamat IP klien untuk kunci rate limit.
//
// Production: Nginx WAJIB menulis `proxy_set_header X-Real-IP $remote_addr;`
// (docs/runbooks/deployment.md) — nilai itu menimpa isian klien sehingga tidak
// bisa dipalsukan. Tanpa X-Real-IP dipakai entri terakhir X-Forwarded-For
// (ditambahkan proxy terdekat); entri pertama bisa diisi bebas oleh klien.

const PANJANG_MAKS = 64;

export function ipKlien(headers: Headers): string {
  const nyata = headers.get('x-real-ip')?.trim();
  const diteruskan = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  return (nyata || diteruskan || 'tak-dikenal').slice(0, PANJANG_MAKS);
}
