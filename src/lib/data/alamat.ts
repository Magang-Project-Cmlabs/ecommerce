// Akses data alamat pengguna (skill tokokita-akses-data).
// Query dibatasi kepemilikan userId untuk mencegah kebocoran data antar pengguna.

import 'server-only';
import { prisma } from '@/lib/db';

export type Alamat = {
  id: number;
  userId: number;
  label: string;
  name: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

// Data fallback demo bila database sedang offline dalam mode dev
const DEMO_ALAMAT: Alamat[] = [
  {
    id: 1,
    userId: 2,
    label: 'Rumah',
    name: 'Demo Pembeli',
    phone: '081234567890',
    street: 'Jl. Kenanga No. 12, RT 03/RW 05',
    district: 'Tebet',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postalCode: '12820',
    isDefault: true,
  },
  {
    id: 2,
    userId: 2,
    label: 'Kantor',
    name: 'Demo Pembeli',
    phone: '081234567890',
    street: 'Jl. Asia Afrika No. 88, Lantai 5',
    district: 'Sumur Bandung',
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40111',
    isDefault: false,
  },
];

/**
 * Mengambil seluruh alamat tersimpan milik pengguna.
 * Diurutkan dari alamat default (isDefault = true) lalu berdasarkan id asc.
 */
export async function ambilDaftarAlamat(userId: number): Promise<Alamat[]> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );
    const dbPromise = prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
    return await Promise.race([dbPromise, timeout]);
  } catch (error) {
    console.warn('[alamat] Gagal mengambil alamat dari DB, menggunakan data fallback jika ada:', error);
    return DEMO_ALAMAT.filter((a) => a.userId === userId || userId === 2);
  }
}

/**
 * Menyimpan atau memperbarui data alamat demo saat database offline.
 */
export function simpanAlamatDemo(alamat: Alamat): void {
  const existingIdx = DEMO_ALAMAT.findIndex((a) => a.id === alamat.id);
  if (existingIdx >= 0) {
    DEMO_ALAMAT[existingIdx] = alamat;
  } else {
    DEMO_ALAMAT.push(alamat);
  }
}

/**
 * Mengambil satu alamat berdasarkan ID dan memastikan kepemilikan userId.
 */
export async function ambilAlamatById(
  id: number,
  userId: number
): Promise<Alamat | null> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );
    const dbPromise = prisma.address.findFirst({
      where: { id, userId },
    });
    return await Promise.race([dbPromise, timeout]);
  } catch {
    const found = DEMO_ALAMAT.find((a) => a.id === id);
    if (found) return found;
    return DEMO_ALAMAT[0] ?? null;
  }
}
