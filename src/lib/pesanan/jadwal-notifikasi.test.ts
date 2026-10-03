import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const after = vi.hoisted(() => vi.fn());
vi.mock('next/server', () => ({ after }));
const kirimNotifikasiPesanan = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock('./notifikasi', () => ({ kirimNotifikasiPesanan }));

import { jadwalkanNotifikasiPesanan } from './jadwal-notifikasi';

afterEach(() => vi.clearAllMocks());

describe('jadwal email pesanan', () => {
  it('di dalam request: email dikirim lewat after, tidak menahan respons', async () => {
    jadwalkanNotifikasiPesanan(7);
    expect(after).toHaveBeenCalledTimes(1);
    expect(kirimNotifikasiPesanan).not.toHaveBeenCalled();
    await after.mock.calls[0]![0]();
    expect(kirimNotifikasiPesanan).toHaveBeenCalledWith(7);
  });
  it('di luar request (after melempar): email tetap dijalankan sekali', () => {
    after.mockImplementationOnce(() => { throw new Error('after() was called outside a request scope'); });
    expect(() => jadwalkanNotifikasiPesanan(9)).not.toThrow();
    expect(kirimNotifikasiPesanan).toHaveBeenCalledTimes(1);
    expect(kirimNotifikasiPesanan).toHaveBeenCalledWith(9);
  });
});
