import { cariSaranProduk } from '@/lib/data/katalog';
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 100);
  try { return Response.json({ products: await cariSaranProduk(q) }, { headers: { 'Cache-Control': 'private, max-age=15' } }); }
  catch (galat) {
    // Alamat DB disensor sebelum masuk log.
    console.error('api/search gagal:', galat instanceof Error ? galat.message.replace(/mysql:\/\/\S+/g, '<db>').replace(/\s+/g, ' ').slice(-400) : 'tidak diketahui');
    return Response.json({ products: [], message: 'Pencarian sementara tidak tersedia.' }, { status: 503 });
  }
}
