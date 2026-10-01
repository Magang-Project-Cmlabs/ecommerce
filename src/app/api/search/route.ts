import { cariSaranProduk } from '@/lib/data/katalog';
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 100);
  try { return Response.json({ products: await cariSaranProduk(q) }, { headers: { 'Cache-Control': 'private, max-age=15' } }); }
  catch { return Response.json({ products: [], message: 'Pencarian sementara tidak tersedia.' }, { status: 503 }); }
}
