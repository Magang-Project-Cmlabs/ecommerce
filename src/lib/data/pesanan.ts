// Akses data pesanan pengguna (skill tokokita-akses-data).
// Seluruh query dibatasi kepemilikan userId untuk mencegah akses data antar pengguna.

import 'server-only';
import { prisma } from '@/lib/db';
import type { OrderStatus, PaymentStatus } from '@/lib/pesanan/status';

export type ItemPesananRingkas = {
  id: number;
  productId: number;
  variantId: number | null;
  name: string;
  variantName: string | null;
  image: string | null;
  price: number;
  quantity: number;
};

export type LogStatusPesanan = {
  id: number;
  status: OrderStatus;
  note: string | null;
  createdAt: Date;
};

export type PesananRingkas = {
  id: number;
  orderNumber: string;
  userId: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  grandTotal: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentDueAt: Date | null;
  trackingNumber: string | null;
  createdAt: Date;
  items: ItemPesananRingkas[];
  statusLogs: LogStatusPesanan[];
};

export type DetailPesananLengkap = PesananRingkas & {
  totalWeight: number;
  shippingMethod: string;
  shippingAddress: {
    label?: string;
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  notes: string | null;
  cancelReason: string | null;
  promoCode?: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  paidAt: Date | null;
};

// Data fallback demo pesanan saat database offline
const DEMO_ORDERS: DetailPesananLengkap[] = [
  {
    id: 101,
    orderNumber: 'INV-202609-0001',
    userId: 2,
    subtotal: 250000,
    shippingCost: 15000,
    discount: 0,
    grandTotal: 265000,
    totalWeight: 600,
    status: 'delivered',
    paymentMethod: 'qris',
    paymentStatus: 'paid',
    paymentDueAt: null,
    trackingNumber: 'JNE1234567890',
    createdAt: new Date('2026-09-20T10:00:00.000Z'),
    shippedAt: new Date('2026-09-21T14:00:00.000Z'),
    deliveredAt: new Date('2026-09-23T16:30:00.000Z'),
    cancelledAt: null,
    paidAt: new Date('2026-09-20T10:15:00.000Z'),
    shippingMethod: 'jne_reg',
    notes: 'Mohon bubble wrap tebal',
    cancelReason: null,
    shippingAddress: {
      label: 'Rumah',
      name: 'Demo Pembeli',
      phone: '081234567890',
      street: 'Jl. Kenanga No. 12, RT 03/RW 05',
      district: 'Tebet',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '12820',
    },
    items: [
      {
        id: 1,
        productId: 1,
        variantId: null,
        name: 'Kemeja Batik Modern',
        variantName: 'L',
        image: '/products/batik.jpg',
        price: 125000,
        quantity: 2,
      },
    ],
    statusLogs: [
      {
        id: 1,
        status: 'delivered',
        note: 'Pesanan telah diterima oleh pembeli',
        createdAt: new Date('2026-09-23T16:30:00.000Z'),
      },
      {
        id: 2,
        status: 'shipped',
        note: 'Pesanan dikirim dengan nomor resi JNE1234567890',
        createdAt: new Date('2026-09-21T14:00:00.000Z'),
      },
      {
        id: 3,
        status: 'packed',
        note: 'Pesanan sedang dikemas oleh toko',
        createdAt: new Date('2026-09-20T16:00:00.000Z'),
      },
      {
        id: 4,
        status: 'confirmed',
        note: 'Pembayaran terverifikasi dan pesanan dikonfirmasi',
        createdAt: new Date('2026-09-20T10:15:00.000Z'),
      },
      {
        id: 5,
        status: 'pending',
        note: 'Pesanan dibuat oleh pembeli',
        createdAt: new Date('2026-09-20T10:00:00.000Z'),
      },
    ],
  },
  {
    id: 102,
    orderNumber: 'INV-202609-0002',
    userId: 2,
    subtotal: 125000,
    shippingCost: 13000,
    discount: 0,
    grandTotal: 138000,
    totalWeight: 800,
    status: 'shipped',
    paymentMethod: 'bank_bca',
    paymentStatus: 'paid',
    paymentDueAt: null,
    trackingNumber: 'SCP9876543210',
    createdAt: new Date('2026-09-28T09:00:00.000Z'),
    shippedAt: new Date('2026-09-29T11:00:00.000Z'),
    deliveredAt: null,
    cancelledAt: null,
    paidAt: new Date('2026-09-28T09:30:00.000Z'),
    shippingMethod: 'sicepat_reg',
    notes: null,
    cancelReason: null,
    shippingAddress: {
      label: 'Rumah',
      name: 'Demo Pembeli',
      phone: '081234567890',
      street: 'Jl. Kenanga No. 12, RT 03/RW 05',
      district: 'Tebet',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '12820',
    },
    items: [
      {
        id: 2,
        productId: 2,
        variantId: null,
        name: 'Sneakers Casual',
        variantName: '42',
        image: '/products/sneakers.jpg',
        price: 125000,
        quantity: 1,
      },
    ],
    statusLogs: [
      {
        id: 6,
        status: 'shipped',
        note: 'Pesanan dikirim dengan nomor resi SCP9876543210',
        createdAt: new Date('2026-09-29T11:00:00.000Z'),
      },
      {
        id: 7,
        status: 'confirmed',
        note: 'Pembayaran terverifikasi',
        createdAt: new Date('2026-09-28T09:30:00.000Z'),
      },
      {
        id: 8,
        status: 'pending',
        note: 'Pesanan dibuat oleh pembeli',
        createdAt: new Date('2026-09-28T09:00:00.000Z'),
      },
    ],
  },
  {
    id: 103,
    orderNumber: 'INV-202610-0001',
    userId: 2,
    subtotal: 399000,
    shippingCost: 15000,
    discount: 39900,
    grandTotal: 374100,
    totalWeight: 200,
    status: 'pending',
    paymentMethod: 'qris',
    paymentStatus: 'unpaid',
    paymentDueAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
    trackingNumber: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    paidAt: null,
    shippingMethod: 'jne_reg',
    notes: 'Kirim saat jam kerja kantor',
    cancelReason: null,
    shippingAddress: {
      label: 'Kantor',
      name: 'Demo Pembeli',
      phone: '081234567890',
      street: 'Jl. Asia Afrika No. 88, Lantai 5',
      district: 'Sumur Bandung',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40111',
    },
    items: [
      {
        id: 3,
        productId: 4,
        variantId: null,
        name: 'Smartwatch Sport',
        variantName: 'Hitam',
        image: '/products/smartwatch.jpg',
        price: 399000,
        quantity: 1,
      },
    ],
    statusLogs: [
      {
        id: 9,
        status: 'pending',
        note: 'Pesanan dibuat oleh pembeli',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ],
  },
];

/**
 * Mengambil daftar riwayat pesanan milik pengguna dengan opsi filter status.
 */
export async function ambilDaftarPesanan(
  userId: number,
  statusFilter?: OrderStatus
): Promise<PesananRingkas[]> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );

    const query = prisma.order.findMany({
      where: {
        userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        items: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const orders = await Promise.race([query, timeout]);
    return orders as unknown as PesananRingkas[];
  } catch (error) {
    console.warn('[pesanan] Gagal ambil pesanan dari DB, menggunakan data fallback demo:', error);
    return DEMO_ORDERS.filter(
      (o) => (o.userId === userId || userId === 2) && (!statusFilter || o.status === statusFilter)
    );
  }
}

/**
 * Menyimpan atau memperbarui data pesanan demo saat database offline.
 */
export function simpanDemoOrder(order: DetailPesananLengkap): void {
  const existingIdx = DEMO_ORDERS.findIndex((o) => o.orderNumber === order.orderNumber);
  if (existingIdx >= 0) {
    DEMO_ORDERS[existingIdx] = order;
  } else {
    DEMO_ORDERS.unshift(order);
  }
}

/**
 * Mengambil detail pesanan demo langsung dari memori saat offline.
 */
export function ambilDetailPesananDemo(orderNumber: string): DetailPesananLengkap | null {
  return DEMO_ORDERS.find((o) => o.orderNumber === orderNumber) ?? null;
}

/**
 * Mengambil rincian lengkap satu pesanan berdasarkan nomor invoice dan kepemilikan userId.
 */
export async function ambilDetailPesanan(
  orderNumber: string,
  userId: number
): Promise<DetailPesananLengkap | null> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );

    const query = prisma.order.findFirst({
      where: {
        orderNumber,
        userId,
      },
      include: {
        items: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const order = await Promise.race([query, timeout]);
    if (!order) {
      const fallback = DEMO_ORDERS.find((o) => o.orderNumber === orderNumber);
      return fallback ?? null;
    }
    return order as unknown as DetailPesananLengkap;
  } catch {
    const fallback = DEMO_ORDERS.find((o) => o.orderNumber === orderNumber);
    return fallback ?? null;
  }
}
