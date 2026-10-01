'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { ambilAlamatById } from '@/lib/data/alamat';
import { ambilProdukCheckout } from '@/lib/data/checkout';
import { cariPesananPembeli } from '@/lib/data/pesanan';
import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { hitungOpsiPengiriman, type KurirKode, type OpsiPengiriman } from '@/lib/pesanan/ongkir';
import { evaluasiPromo } from '@/lib/pesanan/promo';
import { BusinessValidationError, cobaUlangTransaksi, pesanGalat } from '@/lib/pesanan/galat';
import { kirimNotifikasiPesanan } from '@/lib/pesanan/notifikasi';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { cekKodePromo } from '@/actions/promo';
import { checkoutSchema, pratinjauCheckoutSchema, type CheckoutInput } from '@/lib/validations/checkout';
import { nomorPesananSchema } from '@/lib/validations/pesanan';
export type ItemKeranjangInput = { productId: number; variantId: number | null; quantity: number };
export type PratinjauInput = { items: ItemKeranjangInput[]; addressId?: number; shippingMethod?: KurirKode; promoCode?: string };
export type PratinjauItem = { productId: number; variantId: number | null; name: string; variantName: string | null; image: string | null; price: number; weight: number; quantity: number; stock: number; isPreorder: boolean; masalah: null | 'tidak_aktif' | 'varian_wajib' | 'stok_kurang' | 'stok_habis' };
export type Pratinjau = { items: PratinjauItem[]; subtotal: number; totalWeight: number; shippingOptions: OpsiPengiriman[]; shippingCost: number | null; promo: null | { ok: true; code: string; description: string; discount: number } | { ok: false; code: string; message: string }; discount: number; grandTotal: number };
export type HasilBuatPesanan = { ok: true; orderNumber: string } | { ok: false; errors?: Partial<Record<'addressId' | 'shippingMethod' | 'paymentMethod' | 'promoCode' | 'notes' | 'items', string[]>>; message?: string; items?: PratinjauItem[] };
type CheckoutProduct = Awaited<ReturnType<typeof ambilProdukCheckout>>[number];
function evalItems(items: ItemKeranjangInput[], products: CheckoutProduct[]): PratinjauItem[] {
  const byId = new Map(products.map(p => [p.id, p]));
  return items.map(item => {
    const p = byId.get(item.productId);
    const v = p?.variants.find(v => v.id === item.variantId);
    let masalah: PratinjauItem['masalah'] = null;
    if (!p?.isActive || (item.variantId !== null && !v)) masalah = 'tidak_aktif';
    else if (p.variants.length && item.variantId === null) masalah = 'varian_wajib';
    const stock = v?.stock ?? p?.stock ?? 0;
    if (!masalah && !p?.isPreorder) masalah = stock <= 0 ? 'stok_habis' : stock < item.quantity ? 'stok_kurang' : null;
    return { ...item, name: p?.name ?? 'Produk tidak tersedia', variantName: v?.name ?? null, image: p?.images[0]?.url ?? null, price: v?.price ?? p?.price ?? 0, weight: v?.weight ?? p?.weight ?? 0, stock, isPreorder: p?.isPreorder ?? false, masalah };
  });
}
function totals(items: PratinjauItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalWeight = items.reduce((s, i) => s + i.weight * i.quantity, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal > 2147483647 || totalWeight > 2147483647) throw new BusinessValidationError('Total pesanan melewati batas. Kurangi isi keranjang.');
  return { subtotal, totalWeight };
}
export async function pratinjauCheckout(raw: PratinjauInput): Promise<Pratinjau> {
  const input = pratinjauCheckoutSchema.parse(raw);
  const user = input.addressId ? await requireUser('/checkout') : await ambilPenggunaSaatIni();
  const products = await ambilProdukCheckout([...new Set(input.items.map(i => i.productId))]);
  const items = evalItems(input.items, products);
  const { subtotal, totalWeight } = totals(items);
  let shippingOptions: OpsiPengiriman[] = [];
  if (input.addressId && user) {
    const address = await ambilAlamatById(input.addressId, user.id);
    if (!address) throw new BusinessValidationError('Alamat pengiriman tidak ditemukan.');
    shippingOptions = hitungOpsiPengiriman(totalWeight, address.city);
  }
  const selected = shippingOptions.find(o => o.method === input.shippingMethod && o.available);
  const shippingCost = selected?.cost ?? null;
  let promo: Pratinjau['promo'] = null;
  let discount = 0;
  if (input.promoCode) {
    const result = await cekKodePromo(input.promoCode, subtotal);
    promo = result.ok ? { ok: true, code: result.code, description: result.description, discount: result.discount } : { ok: false, code: input.promoCode, message: result.message };
    if (result.ok) discount = result.discount;
  }
  return { items, subtotal, totalWeight, shippingOptions, shippingCost, promo, discount, grandTotal: subtotal + (shippingCost ?? 0) - discount };
}
export async function buatPesanan(rawInput: CheckoutInput): Promise<HasilBuatPesanan> {
  const user = await requireUser('/checkout');
  const parsed = checkoutSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors, message: 'Data pesanan tidak valid. Silakan periksa kembali isian Anda.' };
  const input = parsed.data;
  try {
    const result = await cobaUlangTransaksi(() => prisma.$transaction(async tx => {
      // Lock user: serializes concurrent promo per-user usage and address edits.
      const users = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM users WHERE id = ${user.id} AND deleted_at IS NULL FOR UPDATE`;
      if (!users.length) throw new BusinessValidationError('Akun tidak aktif. Silakan masuk kembali.');
      const address = await tx.address.findFirst({ where: { id: input.addressId, userId: user.id } });
      if (!address) throw new BusinessValidationError('Alamat pengiriman tidak valid atau tidak ditemukan.');
      const productIds = [...new Set(input.items.map(i => i.productId))].sort((a, b) => a - b);
      // Parent rows serialize variant totals; all mutations remain in this transaction.
      await tx.$queryRaw`SELECT id FROM products WHERE id IN (${Prisma.join(productIds)}) ORDER BY id FOR UPDATE`;
      const products = await tx.product.findMany({ where: { id: { in: productIds } }, include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, variants: true } });
      const items = evalItems(input.items, products);
      const invalid = items.find(i => i.masalah);
      if (invalid) throw new BusinessValidationError(invalid.masalah === 'varian_wajib' ? `Pilih varian untuk produk "${invalid.name}".` : `Produk "${invalid.name}" tidak tersedia atau stok tidak mencukupi. Perbarui keranjang Anda.`);
      const { subtotal, totalWeight } = totals(items);
      const shipping = hitungOpsiPengiriman(totalWeight, address.city).find(o => o.method === input.shippingMethod);
      if (!shipping?.available) throw new BusinessValidationError(shipping?.reason ?? 'Kurir tidak tersedia untuk alamat ini.');
      let discount = 0;
      if (input.promoCode) {
        await tx.$queryRaw`SELECT code FROM promo_codes WHERE code = ${input.promoCode} FOR UPDATE`;
        const promo = await tx.promoCode.findUnique({ where: { code: input.promoCode } });
        const usage = await tx.promoUsage.count({ where: { code: input.promoCode, userId: user.id } });
        const validated = evaluasiPromo(promo, subtotal, usage);
        if (!validated.ok) throw new BusinessValidationError(validated.message);
        discount = validated.discount;
        const reserved = await tx.promoCode.updateMany({ where: { code: input.promoCode, isActive: true, ...(promo?.quota !== null && promo?.quota !== undefined ? { usedCount: { lt: promo.quota } } : {}) }, data: { usedCount: { increment: 1 } } });
        if (reserved.count !== 1) throw new BusinessValidationError('Kuota promo sudah habis.');
      }
      const grandTotal = subtotal + shipping.cost - discount;
      if (grandTotal > 2147483647) throw new BusinessValidationError('Total pesanan melewati batas.');
      for (const item of items) {
        const condition = item.isPreorder ? {} : { stock: { gte: item.quantity } };
        if (item.variantId !== null) {
          const reserved = await tx.productVariant.updateMany({ where: { id: item.variantId, productId: item.productId, ...condition }, data: { stock: { decrement: item.quantity } } });
          if (reserved.count !== 1) throw new BusinessValidationError(`Stok "${item.name}" telah berubah.`);
        } else {
          const reserved = await tx.product.updateMany({ where: { id: item.productId, isActive: true, ...condition }, data: { stock: { decrement: item.quantity } } });
          if (reserved.count !== 1) throw new BusinessValidationError(`Stok "${item.name}" telah berubah.`);
        }
        await tx.product.update({ where: { id: item.productId }, data: { soldCount: { increment: item.quantity } } });
      }
      const variantProductIds = [...new Set(items.filter(i => i.variantId !== null).map(i => i.productId))];
      if (variantProductIds.length) {
        const sums = await tx.productVariant.groupBy({ by: ['productId'], where: { productId: { in: variantProductIds } }, _sum: { stock: true } });
        for (const sum of sums) await tx.product.update({ where: { id: sum.productId }, data: { stock: sum._sum.stock ?? 0 } });
      }
      const now = new Date();
      const monthWib = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).format(now).replace('-', '');
      const prefix = `INV-${monthWib}-`;
      const last = await tx.order.findFirst({ where: { orderNumber: { startsWith: prefix } }, orderBy: { id: 'desc' }, select: { orderNumber: true } });
      const sequence = last ? Number(last.orderNumber.split('-')[2]) + 1 : 1;
      const orderNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
      const cod = input.paymentMethod === 'cod';
      const order = await tx.order.create({ data: { orderNumber, userId: user.id, subtotal, shippingCost: shipping.cost, discount, tax: 0, grandTotal, totalWeight, status: cod ? 'confirmed' : 'pending', paymentMethod: input.paymentMethod, paymentStatus: 'unpaid', paymentDueAt: cod ? null : new Date(now.getTime() + 86400000), shippingAddress: { label: address.label, name: address.name, phone: address.phone, street: address.street, district: address.district, city: address.city, province: address.province, postalCode: address.postalCode }, shippingMethod: input.shippingMethod, promoCode: input.promoCode, notes: input.notes,
        items: { create: items.map(i => ({ productId: i.productId, variantId: i.variantId, name: i.name, variantName: i.variantName, image: i.image, price: i.price, weight: i.weight, quantity: i.quantity })) },
        statusLogs: { create: { status: cod ? 'confirmed' : 'pending', note: cod ? 'Pesanan COD dibuat dan dikonfirmasi' : 'Pesanan dibuat oleh pembeli', changedById: user.id } },
      } });
      if (input.promoCode) await tx.promoUsage.create({ data: { code: input.promoCode, userId: user.id, orderId: order.id } });
      return { id: order.id, orderNumber: order.orderNumber };
    }, { isolationLevel: 'ReadCommitted', timeout: 15000, maxWait: 10000 }));
    revalidatePath('/checkout'); revalidatePath('/akun/pesanan'); revalidatePath('/admin'); revalidatePath('/');
    await kirimNotifikasiPesanan(result.id);
    return { ok: true, orderNumber: result.orderNumber };
  } catch (error) {
    console.error('[checkout] Pesanan gagal:', error instanceof BusinessValidationError ? error.message : 'Galat penyimpanan');
    return { ok: false, message: pesanGalat(error, 'Pesanan belum tersimpan. Silakan coba kembali; keranjang Anda tetap tersedia.') };
  }
}
/** Demo opt-in saja. Produksi selalu menolak; gateway adalah jalur pembayaran normal. */
export async function simulasiBayarPesanan(orderNumber: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser('/akun/pesanan');
  if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_SIMULATION_ENABLED !== 'true') return { ok: false, message: 'Gunakan pembayaran Midtrans sandbox melalui tombol Bayar Sekarang.' };
  if (!nomorPesananSchema.safeParse(orderNumber).success) return { ok: false, message: 'Nomor pesanan tidak valid.' };
  try {
    const order = await cariPesananPembeli(orderNumber, user.id);
    if (!order || order.paymentMethod === 'cod' || order.status !== 'pending' || !order.paymentDueAt || order.paymentDueAt <= new Date()) return { ok: false, message: 'Pesanan tidak dapat dibayar.' };
    await ubahStatus(order.id, 'confirmed', 'sistem', { alasan: 'Pembayaran simulasi development', gatewayVerified: true });
    revalidatePath('/akun/pesanan'); revalidatePath(`/checkout/berhasil/${orderNumber}`);
    return { ok: true, message: 'Pembayaran simulasi berhasil diverifikasi.' };
  } catch (error) { return { ok: false, message: pesanGalat(error, 'Pembayaran belum berhasil. Silakan coba kembali.') }; }
}
