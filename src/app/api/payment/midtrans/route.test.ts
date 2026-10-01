import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/payment/pesanan', () => ({ depsNotifikasiProduksi: vi.fn().mockReturnValue({}) }));
vi.mock('@/lib/payment', () => ({ tanganiNotifikasiMidtrans: vi.fn().mockResolvedValue({ hasil: 'signature-salah', httpStatus: 401 }) }));
import { POST } from './route';
import { tanganiNotifikasiMidtrans } from '@/lib/payment';
describe('batas body webhook', () => {
  it('body JSON tidak valid tidak diproses', async () => { expect((await POST(new Request('http://localhost/api/payment/midtrans', { method: 'POST', body: '{' }))).status).toBe(400); });
  it('body besar dengan atau tanpa content-length ditolak', async () => {
    vi.mocked(tanganiNotifikasiMidtrans).mockClear();
    const body = 'x'.repeat(17000);
    expect((await POST(new Request('http://localhost/api/payment/midtrans', { method: 'POST', body, headers: { 'content-length': '17000' } }))).status).toBe(413);
    expect((await POST(new Request('http://localhost/api/payment/midtrans', { method: 'POST', body }))).status).toBe(413);
    expect(tanganiNotifikasiMidtrans).not.toHaveBeenCalled();
  });
  it('status penolakan signature diteruskan', async () => { expect((await POST(new Request('http://localhost/api/payment/midtrans', { method: 'POST', body: '{}' }))).status).toBe(401); });
});
