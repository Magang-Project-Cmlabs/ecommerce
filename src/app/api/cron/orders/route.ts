import { timingSafeEqual } from 'node:crypto';
import { ambilPesananUntukCron } from '@/lib/data/pesanan';
import { ubahStatus } from '@/lib/pesanan/transisi';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret ?? ''}`;
  if (!secret || Buffer.byteLength(given) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return Response.json({ message: 'Tidak diizinkan.' }, { status: 401 });
  try {
    const orders = await ambilPesananUntukCron(new Date());
    const counts = { cancelled: 0, delivered: 0, skipped: 0, failed: 0 };
    for (const order of orders) {
      const target = order.status === 'pending' ? 'cancelled' : 'delivered';
      try { await ubahStatus(order.id, target, 'sistem'); counts[target]++; }
      catch (error) { if (error instanceof Error && error.name === 'BusinessValidationError') counts.skipped++; else { counts.failed++; console.error('[cron] Pesanan gagal diproses:', order.id); } }
    }
    return Response.json(counts, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ message: 'Proses pesanan belum dapat dijalankan.' }, { status: 503 }); }
}
