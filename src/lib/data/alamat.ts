import 'server-only';
import { prisma } from '@/lib/db';
export type Alamat = { id: number; userId: number; label: string; name: string; phone: string; street: string; district: string; city: string; province: string; postalCode: string; isDefault: boolean };
export function ambilDaftarAlamat(userId: number): Promise<Alamat[]> {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] });
}
export function ambilAlamatById(id: number, userId: number): Promise<Alamat | null> {
  return prisma.address.findFirst({ where: { id, userId } });
}
