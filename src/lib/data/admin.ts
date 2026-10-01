import 'server-only';
import { prisma } from '@/lib/db';
import type { Prisma, OrderStatus } from '@/generated/prisma/client';

export async function ringkasanAdmin() {
  const now = new Date();
  const today = new Date(Math.floor((now.getTime() + 7 * 3_600_000) / 86_400_000) * 86_400_000 - 7 * 3_600_000);
  const [pesananHariIni, omzet7, omzet30, perluDiproses, stokMenipis, terbaru] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { paymentStatus: 'paid', paidAt: { gte: new Date(now.getTime() - 7 * 86_400_000) }, status: { not: 'cancelled' } }, _sum: { grandTotal: true } }),
    prisma.order.aggregate({ where: { paymentStatus: 'paid', paidAt: { gte: new Date(now.getTime() - 30 * 86_400_000) }, status: { not: 'cancelled' } }, _sum: { grandTotal: true } }),
    prisma.order.count({ where: { status: { in: ['pending', 'confirmed', 'packed'] } } }),
    prisma.product.findMany({ where: { isActive: true, isPreorder: false, OR: [{ stock: { lte: 5 } }, { variants: { some: { stock: { lte: 5 } } } }] }, select: { id: true, name: true, stock: true, variants: { where: { stock: { lte: 5 } }, select: { name: true, stock: true } } }, orderBy: { stock: 'asc' }, take: 20 }),
    prisma.order.findMany({ select: { id: true, orderNumber: true, status: true, grandTotal: true, createdAt: true, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);
  return { pesananHariIni, omzet7: omzet7._sum.grandTotal ?? 0, omzet30: omzet30._sum.grandTotal ?? 0, perluDiproses, stokMenipis, terbaru };
}

export async function daftarPesananAdmin(status?: OrderStatus, query = '', page = 1) {
  const where: Prisma.OrderWhereInput = { ...(status ? { status } : {}), ...(query ? { OR: [{ orderNumber: { contains: query } }, { user: { name: { contains: query } } }] } : {}) };
  const [items, count] = await Promise.all([
    prisma.order.findMany({ where, select: { id: true, orderNumber: true, createdAt: true, status: true, paymentStatus: true, grandTotal: true, user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20, skip: (page - 1) * 20 }),
    prisma.order.count({ where }),
  ]);
  return { items, count };
}
export const detailPesananAdmin = (id: number) => prisma.order.findUnique({ where: { id }, include: { items: true, statusLogs: { orderBy: { createdAt: 'asc' }, include: { changedBy: { select: { name: true } } } }, user: { select: { name: true, email: true } } } });
export async function daftarProdukAdmin(query = '', active = '', page = 1) {
  const where: Prisma.ProductWhereInput = { ...(query ? { name: { contains: query } } : {}), ...(active === 'aktif' ? { isActive: true } : active === 'arsip' ? { isActive: false } : {}) };
  const [items, count] = await Promise.all([
    prisma.product.findMany({ where, select: { id: true, name: true, price: true, stock: true, isActive: true, category: { select: { name: true } }, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } }, orderBy: { updatedAt: 'desc' }, take: 20, skip: (page - 1) * 20 }),
    prisma.product.count({ where }),
  ]);
  return { items, count };
}
export const detailProdukAdmin = (id: number) => prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: 'asc' } }, variants: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { orderItems: true } } } } } });
export const kategoriAdmin = () => prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { products: true, children: true } } } });
export const promoAdmin = () => prisma.promoCode.findMany({ orderBy: { expiresAt: 'desc' }, include: { _count: { select: { usages: true } } } });
export const bannerAdmin = () => prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
