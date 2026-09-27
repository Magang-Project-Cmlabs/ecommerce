// Rute yang wajib masuk (PRD §12) dan keputusan redirect untuk tamu.
// Murni (tanpa impor Next) supaya dipakai proxy.ts, penjaga server, dan test.

export const RUTE_WAJIB_MASUK = ['/checkout', '/akun', '/wishlist', '/admin'] as const;

/**
 * True untuk rute terlindungi beserta sub-halamannya; "/akunku" tidak ikut.
 * Path dinormalisasi (percent-decode + huruf kecil) supaya "/ADMIN" atau
 * "/%61dmin" tidak lolos dari proxy. Percent-encoding rusak dianggap apa adanya.
 */
export function butuhMasuk(pathname: string): boolean {
  let p = pathname;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    // biarkan apa adanya
  }
  p = p.toLowerCase();
  return RUTE_WAJIB_MASUK.some((r) => p === r || p.startsWith(`${r}/`));
}

/** Alamat halaman masuk yang membawa halaman asal sebagai ?next=. */
export function urlMasuk(pathname: string, search = ''): string {
  return `/masuk?next=${encodeURIComponent(pathname + search)}`;
}

/**
 * Keputusan proxy (cek optimistis, hanya cookie): alamat redirect untuk tamu
 * di rute terlindungi, atau null. Role admin dan keberadaan akun dicek ulang
 * di server oleh requireUser/requireAdmin (src/lib/auth/akses.ts).
 */
export function keputusanProxy(r: { pathname: string; search: string; adaSesiSah: boolean }): string | null {
  return butuhMasuk(r.pathname) && !r.adaSesiSah ? urlMasuk(r.pathname, r.search) : null;
}
