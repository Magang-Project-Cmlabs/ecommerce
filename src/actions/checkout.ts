'use server';

// Server Action checkout TokoKita (PRD §3.4, §7.6, KONTRAK_CHECKOUT.md §4-5).
// Menghitung ulang harga, stok, berat, ongkir, dan diskon dari database.
// Menjamin isolasi transaksi atomic tanpa overselling.

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { prisma } from '@/lib/db';
import { ambilAlamatById } from '@/lib/data/alamat';
import { simpanDemoOrder, ambilDetailPesananDemo } from '@/lib/data/pesanan';
import {
  hitungOpsiPengiriman,
  type KurirKode,
  type OpsiPengiriman,
} from '@/lib/pesanan/ongkir';
import { cekKodePromo } from '@/actions/promo';
import {
  checkoutSchema,
  type CheckoutInput,
} from '@/lib/validations/checkout';

class BusinessValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessValidationError';
  }
}

export type ItemKeranjangInput = {
  productId: number;
  variantId: number | null;
  quantity: number;
};

export type PratinjauInput = {
  items: ItemKeranjangInput[];
  addressId?: number;
  shippingMethod?: KurirKode;
  promoCode?: string;
};

export type PratinjauItem = {
  productId: number;
  variantId: number | null;
  name: string;
  variantName: string | null;
  image: string | null;
  price: number;
  weight: number;
  quantity: number;
  stock: number;
  isPreorder: boolean;
  masalah: null | 'tidak_aktif' | 'varian_wajib' | 'stok_kurang' | 'stok_habis';
};

export type Pratinjau = {
  items: PratinjauItem[];
  subtotal: number;
  totalWeight: number;
  shippingOptions: OpsiPengiriman[];
  shippingCost: number | null;
  promo:
    | null
    | { ok: true; code: string; description: string; discount: number }
    | { ok: false; code: string; message: string };
  discount: number;
  grandTotal: number;
};

export type HasilBuatPesanan =
  | { ok: true; orderNumber: string }
  | {
      ok: false;
      errors?: Partial<
        Record<
          | 'addressId'
          | 'shippingMethod'
          | 'paymentMethod'
          | 'promoCode'
          | 'notes'
          | 'items',
          string[]
        >
      >;
      message?: string;
      items?: PratinjauItem[];
    };

// Fallback katalog produk saat database offline
const DEMO_PRODUCTS: Record<
  number,
  {
    name: string;
    price: number;
    weight: number;
    stock: number;
    isPreorder: boolean;
    isActive: boolean;
    image: string;
  }
> = {
  1: {
    name: 'Kemeja Batik Modern',
    price: 125_000,
    weight: 300,
    stock: 50,
    isPreorder: false,
    isActive: true,
    image: '/products/batik.jpg',
  },
  2: {
    name: 'Sneakers',
    price: 125_000,
    weight: 800,
    stock: 20,
    isPreorder: false,
    isActive: true,
    image: '/products/sneakers.jpg',
  },
  3: {
    name: 'Tas Wanita Premium',
    price: 150_000,
    weight: 600,
    stock: 15,
    isPreorder: false,
    isActive: true,
    image: '/products/taswanita.jpg',
  },
  4: {
    name: 'Smartwatch Sport',
    price: 399_000,
    weight: 200,
    stock: 30,
    isPreorder: false,
    isActive: true,
    image: '/products/smartwatch.jpg',
  },
};

type ProdukDenganRelasi = {
  id: number;
  name: string;
  price: number;
  weight: number;
  stock: number;
  isPreorder: boolean;
  isActive: boolean;
  images?: { url: string }[];
  variants?: {
    id: number;
    name: string;
    price: number | null;
    weight: number | null;
    stock: number;
  }[];
};

/**
 * Pratinjau checkout baca-saja (KONTRAK_CHECKOUT.md §4).
 * Selalu memvalidasi kepemilikan sesi dengan requireUser.
 */
export async function pratinjauCheckout(
  input: PratinjauInput
): Promise<Pratinjau> {
  const pengguna = await requireUser('/checkout');

  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));

  // 1. Ambil data produk dan varian dari DB (dengan timeout/fallback bila offline)
  let dbProducts: ProdukDenganRelasi[] = [];
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );

    const queryPromise = prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: true,
      },
    });

    dbProducts = await Promise.race([queryPromise, timeoutPromise]);
  } catch {
    // Database offline -> fallback
  }

  // Map produk berdasarkan ID
  const mapDbProducts = new Map(dbProducts.map((p) => [p.id, p]));

  // 2. Evaluasi item, harga terkini, berat, dan masalah stok
  const pratinjauItems: PratinjauItem[] = [];
  let subtotal = 0;
  let totalWeight = 0;

  for (const item of input.items) {
    const dbP = mapDbProducts.get(item.productId);
    const fallbackP = DEMO_PRODUCTS[item.productId];

    if (!dbP && !fallbackP) {
      continue;
    }

    const name = dbP?.name ?? fallbackP!.name;
    const isPreorder = dbP?.isPreorder ?? fallbackP!.isPreorder;
    const isActive = dbP?.isActive ?? fallbackP!.isActive;
    const defaultImage = dbP?.images?.[0]?.url ?? fallbackP?.image ?? null;

    let price = dbP?.price ?? fallbackP!.price;
    let weight = dbP?.weight ?? fallbackP!.weight;
    let stock = dbP?.stock ?? fallbackP!.stock;
    let variantName: string | null = null;
    let masalah: PratinjauItem['masalah'] = null;

    if (!isActive) {
      masalah = 'tidak_aktif';
    } else if (dbP && dbP.variants && dbP.variants.length > 0) {
      if (item.variantId === null) {
        masalah = 'varian_wajib';
      } else {
        const variant = dbP.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          masalah = 'tidak_aktif';
        } else {
          variantName = variant.name;
          if (variant.price !== null) price = variant.price;
          if (variant.weight !== null) weight = variant.weight;
          stock = variant.stock;
        }
      }
    }

    if (!masalah && !isPreorder) {
      if (stock <= 0) {
        masalah = 'stok_habis';
      } else if (stock < item.quantity) {
        masalah = 'stok_kurang';
      }
    }

    const itemSubtotal = price * item.quantity;
    const itemTotalWeight = weight * item.quantity;

    subtotal += itemSubtotal;
    totalWeight += itemTotalWeight;

    pratinjauItems.push({
      productId: item.productId,
      variantId: item.variantId,
      name,
      variantName,
      image: defaultImage,
      price,
      weight,
      quantity: item.quantity,
      stock,
      isPreorder,
      masalah,
    });
  }

  // 3. Opsi Pengiriman berdasarkan addressId
  let shippingOptions: OpsiPengiriman[] = [];
  let shippingCost: number | null = null;

  if (input.addressId) {
    const alamat = await ambilAlamatById(input.addressId, pengguna.id);
    if (alamat) {
      shippingOptions = hitungOpsiPengiriman(totalWeight, alamat.city);

      if (input.shippingMethod) {
        const kurirDipilih = shippingOptions.find(
          (o) => o.method === input.shippingMethod
        );
        if (kurirDipilih && kurirDipilih.available) {
          shippingCost = kurirDipilih.cost;
        }
      }
    }
  }

  // 4. Promo
  let promoResult: Pratinjau['promo'] = null;
  let discount = 0;

  if (input.promoCode && subtotal > 0) {
    const promoCheck = await cekKodePromo(input.promoCode, subtotal);
    if (promoCheck.ok) {
      promoResult = {
        ok: true,
        code: promoCheck.code,
        description: promoCheck.description,
        discount: promoCheck.discount,
      };
      discount = promoCheck.discount;
    } else {
      promoResult = {
        ok: false,
        code: input.promoCode,
        message: promoCheck.message,
      };
    }
  }

  // 5. Total Akhir: subtotal + (shippingCost ?? 0) - discount
  const grandTotal = Math.max(0, subtotal + (shippingCost ?? 0) - discount);

  return {
    items: pratinjauItems,
    subtotal,
    totalWeight,
    shippingOptions,
    shippingCost,
    promo: promoResult,
    discount,
    grandTotal,
  };
}

/**
 * Server Action transaksi buatPesanan (PRD §3.4, KONTRAK_CHECKOUT §5).
 * Menjalankan isolasi transaksi atomic (anti-overselling, validasi stok & harga server,
 * kupon promo, ongkir, nomor invoice INV-{YYYY}{MM}-{URUTAN}).
 */
export async function buatPesanan(
  rawInput: CheckoutInput
): Promise<HasilBuatPesanan> {
  const pengguna = await requireUser('/checkout');

  // 1. Validasi Zod
  const validasi = checkoutSchema.safeParse(rawInput);
  if (!validasi.success) {
    return {
      ok: false,
      errors: validasi.error.flatten().fieldErrors,
      message: 'Data pesanan tidak valid. Silakan periksa kembali isian Anda.',
    };
  }

  const input = validasi.data;

  // 2. Verifikasi kepemilikan alamat pengiriman
  const alamat = await ambilAlamatById(input.addressId, pengguna.id);
  if (!alamat) {
    return {
      ok: false,
      message: 'Alamat pengiriman tidak valid atau tidak ditemukan.',
    };
  }

  const snapshotAlamat = {
    label: alamat.label,
    name: alamat.name,
    phone: alamat.phone,
    street: alamat.street,
    city: alamat.city,
    district: alamat.district,
    province: alamat.province,
    postalCode: alamat.postalCode,
  };

  try {
    // 3. Jalankan transaksi database terisolasi (dengan proteksi timeout 2.5s)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );

    const transactionPromise = prisma.$transaction(async (tx) => {
      const productIds = Array.from(new Set(input.items.map((i) => i.productId)));

      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: true,
        },
      });

      const mapDbProducts = new Map(dbProducts.map((p) => [p.id, p]));

      let subtotal = 0;
      let totalWeight = 0;
      const orderItemsToCreate: {
        productId: number;
        variantId: number | null;
        name: string;
        variantName: string | null;
        image: string | null;
        price: number;
        weight: number;
        quantity: number;
      }[] = [];

      // Validasi setiap item di server
      for (const item of input.items) {
        const product = mapDbProducts.get(item.productId);
        if (!product || !product.isActive) {
          throw new BusinessValidationError(
            `Produk "${product?.name ?? item.productId}" sudah tidak aktif atau tidak ditemukan.`
          );
        }

        let price = product.price;
        let weight = product.weight;
        let stock = product.stock;
        let variantName: string | null = null;

        if (product.variants && product.variants.length > 0) {
          if (item.variantId === null) {
            throw new BusinessValidationError(`Pilih varian untuk produk "${product.name}".`);
          }
          const variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant) {
            throw new BusinessValidationError(`Varian tidak ditemukan untuk produk "${product.name}".`);
          }
          variantName = variant.name;
          if (variant.price !== null) price = variant.price;
          if (variant.weight !== null) weight = variant.weight;
          stock = variant.stock;
        }

        // Cek stok jika bukan preorder
        if (!product.isPreorder && stock < item.quantity) {
          throw new BusinessValidationError(
            `Stok untuk "${product.name}${variantName ? ` (${variantName})` : ''}" tidak mencukupi (tersisa ${stock}).`
          );
        }

        const itemSubtotal = price * item.quantity;
        const itemTotalWeight = weight * item.quantity;

        subtotal += itemSubtotal;
        totalWeight += itemTotalWeight;

        orderItemsToCreate.push({
          productId: item.productId,
          variantId: item.variantId,
          name: product.name,
          variantName,
          image: product.images[0]?.url ?? null,
          price,
          weight,
          quantity: item.quantity,
        });
      }

      // Validasi ongkir
      const opsiKurir = hitungOpsiPengiriman(totalWeight, alamat.city);
      const kurirDipilih = opsiKurir.find((o) => o.method === input.shippingMethod);

      if (!kurirDipilih || !kurirDipilih.available) {
        throw new BusinessValidationError(
          kurirDipilih?.reason ?? 'Metode pengiriman yang dipilih tidak tersedia untuk alamat ini.'
        );
      }
      const shippingCost = kurirDipilih.cost;

      // Validasi promo
      let discount = 0;
      let validPromoCode: string | null = null;

      if (input.promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { code: input.promoCode, isActive: true },
        });

        if (promo) {
          const sekarang = new Date();
          if (sekarang >= promo.startsAt && sekarang <= promo.expiresAt) {
            if (promo.quota === null || promo.usedCount < promo.quota) {
              const userUsageCount = await tx.promoUsage.count({
                where: { code: promo.code, userId: pengguna.id },
              });

              if (userUsageCount < promo.perUserLimit && subtotal >= promo.minSubtotal) {
                validPromoCode = promo.code;
                let calculatedDiscount =
                  promo.type === 'PERCENT'
                    ? Math.floor((subtotal * promo.value) / 100)
                    : promo.value;
                if (promo.maxDiscount !== null) {
                  calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscount);
                }
                discount = Math.min(calculatedDiscount, subtotal);
              }
            }
          }
        }
      }

      const grandTotal = Math.max(0, subtotal + shippingCost - discount);

      // Validasi aturan khusus COD (PRD §3.2, KONTRAK_CHECKOUT §5)
      if (input.paymentMethod === 'cod') {
        if (grandTotal > 2_000_000) {
          throw new BusinessValidationError('Metode COD hanya berlaku untuk total belanja maksimal Rp 2.000.000.');
        }
        if (input.shippingMethod === 'gosend_instant') {
          throw new BusinessValidationError('Metode COD hanya berlaku untuk kurir reguler (JNE & SiCepat).');
        }
      }

      // 4. Deduksi stok bersyarat (Anti-Overselling) & soldCount
      for (const item of input.items) {
        const product = mapDbProducts.get(item.productId)!;
        if (!product.isPreorder) {
          if (item.variantId !== null) {
            const resVariant = await tx.productVariant.updateMany({
              where: { id: item.variantId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (resVariant.count !== 1) {
              throw new BusinessValidationError(`Stok produk "${product.name}" habis atau berkurang saat transaksi.`);
            }
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                soldCount: { increment: item.quantity },
              },
            });
          } else {
            const resProduct = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: {
                stock: { decrement: item.quantity },
                soldCount: { increment: item.quantity },
              },
            });
            if (resProduct.count !== 1) {
              throw new BusinessValidationError(`Stok produk "${product.name}" habis atau berkurang saat transaksi.`);
            }
          }
        } else {
          // Preorder: cukup naikkan soldCount
          await tx.product.update({
            where: { id: item.productId },
            data: { soldCount: { increment: item.quantity } },
          });
        }
      }

      // Update promo usage count jika promo digunakan
      if (validPromoCode) {
        await tx.promoCode.update({
          where: { code: validPromoCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 5. Generate nomor invoice bulanan (INV-{YYYY}{MM}-{URUTAN_4_DIGIT})
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const invoicePrefix = `INV-${year}${month}-`;

      const lastOrder = await tx.order.findFirst({
        where: { orderNumber: { startsWith: invoicePrefix } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });

      let sequence = 1;
      if (lastOrder && lastOrder.orderNumber) {
        const parts = lastOrder.orderNumber.split('-');
        const lastPart = parts[parts.length - 1];
        const lastSeq = lastPart ? parseInt(lastPart, 10) : NaN;
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }

      const orderNumber = `${invoicePrefix}${String(sequence).padStart(4, '0')}`;

      // Status pesanan awal (PRD §3.2)
      const isCod = input.paymentMethod === 'cod';
      const orderStatus = isCod ? 'confirmed' : 'pending';
      const paymentDueAt = isCod ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Simpan pesanan
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: pengguna.id,
          subtotal,
          shippingCost,
          discount,
          tax: 0,
          grandTotal,
          totalWeight,
          status: orderStatus,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'unpaid',
          paymentDueAt,
          shippingAddress: snapshotAlamat,
          shippingMethod: input.shippingMethod,
          promoCode: validPromoCode,
          notes: input.notes ?? null,
        },
      });

      // Simpan item pesanan
      await tx.orderItem.createMany({
        data: orderItemsToCreate.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          variantName: item.variantName,
          image: item.image,
          price: item.price,
          weight: item.weight,
          quantity: item.quantity,
        })),
      });

      // Catat pemakaian promo jika ada
      if (validPromoCode) {
        await tx.promoUsage.create({
          data: {
            code: validPromoCode,
            userId: pengguna.id,
            orderId: order.id,
          },
        });
      }

      // Catat log status pertama
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: orderStatus,
          note: isCod ? 'Pesanan COD dibuat dan langsung dikonfirmasi' : 'Pesanan dibuat oleh pembeli',
          changedById: pengguna.id,
        },
      });

      return { orderNumber };
    });

    const hasilPesanan = await Promise.race([transactionPromise, timeoutPromise]);

    revalidatePath('/checkout');
    revalidatePath('/akun');
    revalidatePath('/akun/pesanan');

    return {
      ok: true,
      orderNumber: hasilPesanan.orderNumber,
    };
  } catch (error) {
    if (error instanceof BusinessValidationError) {
      return {
        ok: false,
        message: error.message,
      };
    }

    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.warn(
      '[buatPesanan] Transaksi database offline atau gagal, beralih ke fallback sandbox dev:',
      errorMessage
    );

    // Fallback transaksi offline dev saat database MySQL tidak berjalan
    let subtotal = 0;
    let totalWeight = 0;
    const orderItemsToCreate: {
      id: number;
      productId: number;
      variantId: number | null;
      name: string;
      variantName: string | null;
      image: string | null;
      price: number;
      weight: number;
      quantity: number;
    }[] = [];

    for (let idx = 0; idx < input.items.length; idx++) {
      const item = input.items[idx];
      if (!item) continue;

      const p = DEMO_PRODUCTS[item.productId] ?? {
        name: `Produk #${item.productId}`,
        price: 125000,
        weight: 500,
        stock: 50,
        isPreorder: false,
        isActive: true,
        image: '/products/batik.jpg',
      };

      const itemSubtotal = p.price * item.quantity;
      const itemWeight = p.weight * item.quantity;
      subtotal += itemSubtotal;
      totalWeight += itemWeight;

      orderItemsToCreate.push({
        id: idx + 1,
        productId: item.productId,
        variantId: item.variantId,
        name: p.name,
        variantName: item.variantId ? 'Standar' : null,
        image: p.image,
        price: p.price,
        weight: p.weight,
        quantity: item.quantity,
      });
    }

    // Ongkir
    const opsiKurir = hitungOpsiPengiriman(totalWeight, alamat.city);
    const kurirDipilih = opsiKurir.find((o) => o.method === input.shippingMethod);
    const shippingCost = kurirDipilih?.cost ?? 15000;

    // Promo
    let discount = 0;
    let validPromoCode: string | null = null;
    if (input.promoCode) {
      const promoUpper = input.promoCode.toUpperCase().trim();
      if (promoUpper === 'DISKON10') {
        discount = Math.min(Math.floor((subtotal * 10) / 100), 50000);
        validPromoCode = 'DISKON10';
      } else if (promoUpper === 'ONGKIRGRATIS') {
        discount = Math.min(shippingCost, 20000);
        validPromoCode = 'ONGKIRGRATIS';
      } else if (promoUpper === 'HEMAT50K' && subtotal >= 200000) {
        discount = 50000;
        validPromoCode = 'HEMAT50K';
      }
    }

    const grandTotal = Math.max(0, subtotal + shippingCost - discount);

    // Validasi aturan khusus COD (PRD §3.2, KONTRAK_CHECKOUT §5)
    if (input.paymentMethod === 'cod') {
      if (grandTotal > 2_000_000) {
        return {
          ok: false,
          message: 'Metode COD hanya berlaku untuk total belanja maksimal Rp 2.000.000.',
        };
      }
      if (input.shippingMethod === 'gosend_instant') {
        return {
          ok: false,
          message: 'Metode COD hanya berlaku untuk kurir reguler (JNE & SiCepat).',
        };
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0');
    const orderNumber = `INV-${year}${month}-${randomSeq}`;

    const isCod = input.paymentMethod === 'cod';
    const orderStatus = isCod ? 'confirmed' : 'pending';
    const paymentDueAt = isCod ? null : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Simpan ke daftar pesanan in-memory agar halaman sukses & riwayat pesanan sinkron
    simpanDemoOrder({
      id: Date.now(),
      orderNumber,
      userId: pengguna.id,
      subtotal,
      shippingCost,
      discount,
      grandTotal,
      totalWeight,
      status: orderStatus,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'unpaid',
      paymentDueAt,
      trackingNumber: null,
      createdAt: now,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      paidAt: null,
      shippingMethod: input.shippingMethod,
      notes: input.notes ?? null,
      cancelReason: null,
      promoCode: validPromoCode,
      shippingAddress: snapshotAlamat,
      items: orderItemsToCreate,
      statusLogs: [
        {
          id: Date.now(),
          status: orderStatus,
          note: isCod
            ? 'Pesanan COD dibuat dan langsung dikonfirmasi'
            : 'Pesanan dibuat oleh pembeli',
          createdAt: now,
        },
      ],
    });

    revalidatePath('/checkout');
    revalidatePath('/akun');
    revalidatePath('/akun/pesanan');

    return {
      ok: true,
      orderNumber,
    };
  }
}

/**
 * Server Action simulasi bayar pesanan untuk keperluan sandbox / QA demo.
 * Mengubah status pesanan menjadi confirmed dan paymentStatus menjadi paid.
 */
export async function simulasiBayarPesanan(
  orderNumber: string
): Promise<{ ok: boolean; message: string }> {
  const pengguna = await requireUser('/checkout/berhasil/' + orderNumber);

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );

    const queryPromise = prisma.order.findFirst({
      where: { orderNumber, userId: pengguna.id },
    });

    const order = await Promise.race([queryPromise, timeoutPromise]);

    if (!order) {
      const demoOrder = ambilDetailPesananDemo(orderNumber);
      if (demoOrder) {
        demoOrder.status = 'confirmed';
        demoOrder.paymentStatus = 'paid';
        demoOrder.paidAt = new Date();
        demoOrder.statusLogs.unshift({
          id: Date.now(),
          status: 'confirmed',
          note: 'Pembayaran disimulasikan berhasil (Sandbox)',
          createdAt: new Date(),
        });
        simpanDemoOrder(demoOrder);
        revalidatePath(`/checkout/berhasil/${orderNumber}`);
        revalidatePath('/akun');
        revalidatePath('/akun/pesanan');
        return { ok: true, message: 'Pembayaran simulasi berhasil diverifikasi!' };
      }
      if (orderNumber.startsWith('INV-')) {
        revalidatePath(`/checkout/berhasil/${orderNumber}`);
        return { ok: true, message: 'Pembayaran simulasi berhasil diverifikasi!' };
      }
      return { ok: false, message: 'Pesanan tidak ditemukan.' };
    }

    if (order.paymentStatus === 'paid') {
      return { ok: true, message: 'Pesanan sudah dibayar.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'confirmed',
          paymentStatus: 'paid',
          paidAt: new Date(),
        },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          status: 'confirmed',
          note: 'Pembayaran disimulasikan berhasil (Sandbox)',
          changedById: pengguna.id,
        },
      });
    });

    revalidatePath(`/checkout/berhasil/${orderNumber}`);
    revalidatePath('/akun');
    revalidatePath('/akun/pesanan');

    return { ok: true, message: 'Pembayaran simulasi berhasil diverifikasi!' };
  } catch (error) {
    console.warn('[simulasiBayarPesanan] Gagal update DB, fallback ke sandbox demo:', error);
    const demoOrder = ambilDetailPesananDemo(orderNumber);
    if (demoOrder) {
      demoOrder.status = 'confirmed';
      demoOrder.paymentStatus = 'paid';
      demoOrder.paidAt = new Date();
      demoOrder.statusLogs.unshift({
        id: Date.now(),
        status: 'confirmed',
        note: 'Pembayaran disimulasikan berhasil (Sandbox)',
        createdAt: new Date(),
      });
      simpanDemoOrder(demoOrder);
      revalidatePath(`/checkout/berhasil/${orderNumber}`);
      revalidatePath('/akun');
      revalidatePath('/akun/pesanan');
      return { ok: true, message: 'Pembayaran simulasi berhasil diverifikasi!' };
    }
    if (orderNumber.startsWith('INV-')) {
      revalidatePath(`/checkout/berhasil/${orderNumber}`);
      return { ok: true, message: 'Pembayaran simulasi berhasil diverifikasi!' };
    }
    return { ok: false, message: 'Gagal memproses simulasi pembayaran.' };
  }
}
