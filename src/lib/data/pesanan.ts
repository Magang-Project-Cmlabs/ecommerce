import 'server-only';
import { prisma } from '@/lib/db';
import type { OrderStatus, PaymentStatus } from '@/lib/pesanan/status';
export type ItemPesananRingkas = { id: number; productId: number; productSlug?: string; variantId: number | null; name: string; variantName: string | null; image: string | null; price: number; quantity: number };
export type LogStatusPesanan = { id: number; status: OrderStatus; note: string | null; createdAt: Date };
export type PesananRingkas = { id: number; orderNumber: string; userId: number; subtotal: number; shippingCost: number; discount: number; grandTotal: number; status: OrderStatus; paymentMethod: string; paymentStatus: PaymentStatus; paymentDueAt: Date | null; trackingNumber: string | null; createdAt: Date; items: ItemPesananRingkas[]; statusLogs: LogStatusPesanan[] };
export type DetailPesananLengkap = PesananRingkas & { totalWeight: number; shippingMethod: string; shippingAddress: { label?: string; name?: string; phone?: string; street?: string; city?: string; district?: string; province?: string; postalCode?: string }; notes: string | null; cancelReason: string | null; promoCode: string | null; shippedAt: Date | null; deliveredAt: Date | null; cancelledAt: Date | null; paidAt: Date | null; paymentUrl?: string | null };
export function ambilDaftarPesanan(userId: number, statusFilter?: OrderStatus): Promise<PesananRingkas[]> {
  return prisma.order.findMany({ where: { userId, ...(statusFilter ? { status: statusFilter } : {}) }, include: { items: true, statusLogs: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 } }, orderBy: { id: 'desc' } });
}
export async function ambilDetailPesanan(orderNumber: string, userId: number): Promise<DetailPesananLengkap | null> {
  const order = await prisma.order.findFirst({ where: { orderNumber, userId }, include: { items: { include: { product: { select: { slug: true } } } }, statusLogs: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] } } });
  if (!order) return null;
  return { ...order, items: order.items.map(({ product, ...item }) => ({ ...item, productSlug: product.slug })), shippingAddress: order.shippingAddress as DetailPesananLengkap['shippingAddress'] };
}
export function cariPesananPembeli(orderNumber: string, userId: number) {
  return prisma.order.findFirst({ where: { orderNumber, userId }, include: { items: true } });
}
export function cariPesananGateway(orderNumber: string) {
  return prisma.order.findUnique({ where: { orderNumber }, select: { id: true, orderNumber: true, status: true, paymentStatus: true, paymentMethod: true, grandTotal: true, paymentTransactionId: true } });
}
export function ambilPesananUntukCron(now: Date) {
  return prisma.order.findMany({ where: { OR: [{ status: 'pending', paymentDueAt: { lt: now } }, { status: 'shipped', shippedAt: { lt: new Date(now.getTime() - 7 * 86400000) } }] }, select: { id: true, status: true }, take: 500, orderBy: { id: 'asc' } });
}
export function ambilEmailPesanan(id: number) {
  return prisma.order.findUnique({ where: { id }, select: { orderNumber: true, status: true, grandTotal: true, trackingNumber: true, user: { select: { email: true, name: true, deletedAt: true } } } });
}
/** Resi, kurir, dan status pesanan untuk lacak paket. userId null = admin (tanpa filter pemilik). */
export function ambilResiPesanan(orderNumber: string, userId: number | null) {
  return prisma.order.findFirst({ where: { orderNumber, ...(userId === null ? {} : { userId }) }, select: { trackingNumber: true, shippingMethod: true, status: true } });
}
