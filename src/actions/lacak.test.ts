import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ unstable_cache: (fn: (...a: unknown[]) => unknown) => fn }));
const pengguna = vi.hoisted(() => ({ nilai: { id: 7, role: 'customer' } as { id: number; role: string } }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn(async () => pengguna.nilai) }));
const ambilResiPesanan = vi.hoisted(() => vi.fn());
vi.mock('@/lib/data/pesanan', () => ({ ambilResiPesanan }));
const catatBatasAuthDb = vi.hoisted(() => vi.fn(async () => ({ boleh: true })));
vi.mock('@/lib/data/batas-auth', () => ({ catatBatasAuthDb }));
const lacakResi = vi.hoisted(() => vi.fn());
vi.mock('@/lib/pengiriman/lacak', () => ({ lacakResi }));

import { lacakPesanan } from './lacak';

const dikirim = { trackingNumber: 'JNE123456789', shippingMethod: 'jne_reg', status: 'shipped' };
afterEach(() => { vi.clearAllMocks(); pengguna.nilai = { id: 7, role: 'customer' }; });

describe('lacakPesanan (D20)', () => {
  it('pembeli hanya mencari pesanan miliknya sendiri', async () => {
    ambilResiPesanan.mockResolvedValue(null);
    expect(await lacakPesanan('INV-202610-0001')).toEqual({ status: 'tidak-ditemukan' });
    expect(ambilResiPesanan).toHaveBeenCalledWith('INV-202610-0001', 7);
    expect(lacakResi).not.toHaveBeenCalled();
  });

  it('admin boleh melacak pesanan siapa pun', async () => {
    pengguna.nilai = { id: 1, role: 'admin' };
    ambilResiPesanan.mockResolvedValue(dikirim);
    lacakResi.mockResolvedValue({ status: 'tidak-ditemukan' });
    await lacakPesanan('INV-202610-0001');
    expect(ambilResiPesanan).toHaveBeenCalledWith('INV-202610-0001', null);
    expect(lacakResi).toHaveBeenCalledWith('jne_reg', 'JNE123456789');
  });

  it('nomor pesanan tidak sah atau pesanan belum dikirim tidak dilacak', async () => {
    expect(await lacakPesanan('bukan-nomor')).toEqual({ status: 'tidak-ditemukan' });
    ambilResiPesanan.mockResolvedValue({ ...dikirim, status: 'packed' });
    expect(await lacakPesanan('INV-202610-0001')).toEqual({ status: 'tidak-ditemukan' });
    expect(lacakResi).not.toHaveBeenCalled();
  });

  it('pembatas pemakaian per pengguna', async () => {
    ambilResiPesanan.mockResolvedValue(dikirim);
    catatBatasAuthDb.mockResolvedValueOnce({ boleh: false, tungguDetik: 120 } as never);
    expect(await lacakPesanan('INV-202610-0001')).toEqual({ status: 'dibatasi', tungguDetik: 120 });
    expect(catatBatasAuthDb).toHaveBeenCalledWith('lacak:u:7', undefined, expect.any(Date), { maks: 20, jendelaMs: 600_000 });
    expect(lacakResi).not.toHaveBeenCalled();
  });

  it('galat sementara dilaporkan sebagai gagal', async () => {
    ambilResiPesanan.mockResolvedValue(dikirim);
    lacakResi.mockResolvedValue({ status: 'gagal' });
    expect(await lacakPesanan('INV-202610-0001')).toEqual({ status: 'gagal' });
  });
});
