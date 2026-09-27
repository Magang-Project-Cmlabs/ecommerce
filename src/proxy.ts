// Proxy Next.js 16 (dulu "middleware"): cek OPTIMISTIS untuk rute yang wajib
// masuk — hanya membaca cookie sesi, tanpa database, karena berjalan di setiap
// request termasuk prefetch. Bukan pelindung utama: setiap halaman dan Server
// Action tetap memanggil requireUser/requireAdmin (src/lib/auth/akses.ts).

import { NextResponse, type NextRequest } from 'next/server';
import { keputusanProxy } from '@/lib/auth/rute';
import { NAMA_COOKIE_SESI, bacaTokenSesi, kunciDariRahasia } from '@/lib/auth/token';

export async function proxy(request: NextRequest) {
  const sesi = await bacaTokenSesi(
    request.cookies.get(NAMA_COOKIE_SESI)?.value,
    kunciDariRahasia(process.env.AUTH_SECRET),
  );
  const tujuan = keputusanProxy({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    adaSesiSah: sesi !== null,
  });
  return tujuan ? NextResponse.redirect(new URL(tujuan, request.url)) : NextResponse.next();
}

// Harus konstanta literal (dianalisis saat build). Sinkron dengan
// RUTE_WAJIB_MASUK — dijaga test penjaga-halaman.test.ts.
export const config = {
  matcher: ['/checkout/:path*', '/akun/:path*', '/wishlist/:path*', '/admin/:path*'],
};
