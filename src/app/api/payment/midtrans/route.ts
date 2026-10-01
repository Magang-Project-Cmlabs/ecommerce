import { revalidatePath } from 'next/cache';
import { tanganiNotifikasiMidtrans } from '@/lib/payment';
import { depsNotifikasiProduksi } from '@/lib/payment/pesanan';
export const runtime = 'nodejs';
const MAX_BYTES = 16384;
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) return Response.json({ hasil: 'terlalu-besar' }, { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ hasil: 'tidak-valid' }, { status: 400 });
  let text = '';
  let length = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel(); return Response.json({ hasil: 'terlalu-besar' }, { status: 413 }); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const body = JSON.parse(text);
    const result = await tanganiNotifikasiMidtrans(body, depsNotifikasiProduksi());
    if (result.hasil === 'dikonfirmasi' || result.hasil === 'dibatalkan') { revalidatePath('/akun/pesanan', 'layout'); revalidatePath('/checkout'); revalidatePath('/admin'); }
    return Response.json({ hasil: result.hasil }, { status: result.httpStatus });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ hasil: 'tidak-valid' }, { status: 400 });
    console.error('[midtrans] Webhook gagal diproses.');
    return Response.json({ hasil: 'galat' }, { status: 503 });
  }
}
