import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock requireUser untuk mengembalikan pengguna demo terautentikasi
vi.mock('@/lib/auth/akses', () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: 2,
    name: 'Demo Pembeli',
    email: 'demo@tokokita.id',
    role: 'customer',
    phone: '081234567890',
  }),
  requireAdmin: vi.fn().mockResolvedValue({
    id: 1,
    name: 'Admin',
    email: 'admin@tokokita.id',
    role: 'admin',
  }),
}));

// Mock prisma untuk mensimulasikan error transaksi saat DB offline
vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(() => {
      throw new Error('Transaction API error: Unable to start a transaction in the given time.');
    }),
    order: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    address: {
      findFirst: vi.fn().mockResolvedValue({
        id: 1,
        userId: 2,
        label: 'Rumah',
        name: 'Demo Pembeli',
        phone: '081234567890',
        street: 'Jl. Kenanga No. 12',
        district: 'Tebet',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12820',
        isDefault: true,
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    product: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { buatPesanan, simulasiBayarPesanan } from './checkout';
import { batalkanPesanan } from './pesanan';

describe('Server Action buatPesanan', () => {
  it('berhasil membuat pesanan dalam mode offline / sandbox fallback dengan nomor INV-...', async () => {
    const res = await buatPesanan({
      addressId: 1,
      shippingMethod: 'jne_reg',
      paymentMethod: 'qris',
      notes: 'Harap dikemas rapi',
      items: [
        {
          productId: 1,
          variantId: null,
          quantity: 2,
        },
      ],
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.orderNumber).toMatch(/^INV-\d{6}-\d{4}$/);
    }
  });

  it('menolak pesanan jika input validasi gagal (kuantitas 0)', async () => {
    const res = await buatPesanan({
      addressId: 1,
      shippingMethod: 'jne_reg',
      paymentMethod: 'qris',
      items: [
        {
          productId: 1,
          variantId: null,
          quantity: 0,
        },
      ],
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('Data pesanan tidak valid');
    }
  });

  it('menolak metode pembayaran COD jika total belanja melebihi batas Rp 2.000.000', async () => {
    const res = await buatPesanan({
      addressId: 1,
      shippingMethod: 'jne_reg',
      paymentMethod: 'cod',
      items: [
        {
          productId: 4, // Smartwatch Sport Rp 399.000 x 6 = Rp 2.394.000
          variantId: null,
          quantity: 6,
        },
      ],
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('Metode COD hanya berlaku untuk total belanja maksimal Rp 2.000.000');
    }
  });

  it('menolak metode pembayaran COD jika menggunakan kurir instan gosend_instant', async () => {
    const res = await buatPesanan({
      addressId: 1,
      shippingMethod: 'gosend_instant',
      paymentMethod: 'cod',
      items: [
        {
          productId: 1,
          variantId: null,
          quantity: 1,
        },
      ],
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('Metode COD hanya berlaku untuk kurir reguler');
    }
  });

  it('berhasil melakukan simulasi pembayaran pesanan', async () => {
    // 1. Buat pesanan baru
    const pesanan = await buatPesanan({
      addressId: 1,
      shippingMethod: 'jne_reg',
      paymentMethod: 'qris',
      items: [
        {
          productId: 1,
          variantId: null,
          quantity: 1,
        },
      ],
    });

    expect(pesanan.ok).toBe(true);
    if (pesanan.ok) {
      // 2. Simulasikan bayar
      const hasilBayar = await simulasiBayarPesanan(pesanan.orderNumber);
      expect(hasilBayar.ok).toBe(true);
      expect(hasilBayar.message).toContain('berhasil diverifikasi');
    }
  });

  it('berhasil membatalkan pesanan yang berstatus pending', async () => {
    // 1. Buat pesanan baru berstatus pending
    const pesanan = await buatPesanan({
      addressId: 1,
      shippingMethod: 'jne_reg',
      paymentMethod: 'qris',
      items: [
        {
          productId: 2,
          variantId: null,
          quantity: 1,
        },
      ],
    });

    expect(pesanan.ok).toBe(true);
    if (pesanan.ok) {
      // 2. Batalkan pesanan
      const hasilBatal = await batalkanPesanan(
        pesanan.orderNumber,
        'Ingin mengubah alamat pengiriman'
      );
      expect(hasilBatal.ok).toBe(true);
      expect(hasilBatal.message).toContain('berhasil dibatalkan');
    }
  });
});
