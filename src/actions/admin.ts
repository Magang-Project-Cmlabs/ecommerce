'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { after } from 'next/server';
import { requireAdmin } from '@/lib/auth/akses';
import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { verifikasiTokenGambar } from '@/lib/upload-token';
import { hapusGambarTakTerpakai } from '@/lib/data/gambar';
import { bannerAdminSchema, kategoriAdminSchema, produkAdminSchema, promoAdminSchema, statusAdminSchema, idAdminSchema, type AdminActionState } from '@/lib/validations/admin';
import { z } from 'zod';

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
const checked = (form: FormData, key: string) => form.get(key) === 'on';
const fields = (form: FormData) => Object.fromEntries(form.entries());
function failure(error: unknown): AdminActionState {
  if (error instanceof z.ZodError) return { message: 'Periksa isian formulir.', errors: z.flattenError(error).fieldErrors as Record<string, string[]> };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return { message: 'Slug atau kode sudah digunakan. Gunakan nilai lain.' };
    if (error.code === 'P2003') return { message: 'Data masih dipakai oleh produk atau pesanan lain.' };
    if (error.code === 'P2025') return { message: 'Data tidak ditemukan. Muat ulang halaman.' };
    console.error('Mutasi admin gagal', error.code);
    return { message: 'Data belum dapat disimpan. Silakan coba lagi.' };
  }
  if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientUnknownRequestError || error instanceof Prisma.PrismaClientValidationError) {
    console.error('Mutasi admin gagal terhubung ke database');
    return { message: 'Data belum dapat disimpan. Silakan coba lagi.' };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: 'Terjadi kesalahan. Silakan coba lagi.' };
}
function refresh() {
  updateTag('katalog-publik');
  revalidatePath('/admin', 'layout'); revalidatePath('/', 'layout');
}
/** File lama dibersihkan setelah respons terkirim; kegagalan tidak membatalkan simpanan. */
function bersihkanGambar(urls: (string | null | undefined)[]) {
  if (urls.some(Boolean)) after(() => hapusGambarTakTerpakai(urls).then(() => undefined));
}
function decode(form: FormData, key: string) {
  try { return JSON.parse(text(form, key) || '[]') as unknown; }
  catch { throw new Error(`Isian ${key} tidak valid.`); }
}
function tokens(form: FormData): string[] {
  if (form.getAll('images').some((value) => value instanceof File && value.size > 0)) throw new Error('Unggah gambar satu per satu sebelum menyimpan formulir.');
  const raw = decode(form, 'uploadTokens');
  return z.array(z.string().min(1).max(2048)).max(8).parse(raw);
}

export async function simpanProdukAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin('/admin/produk');
  try {
    const specs: Record<string, string> = {};
    for (const line of text(form, 'specsText').split('\n').filter((v) => v.trim())) {
      const separator = line.indexOf(':');
      if (separator < 1) return { message: 'Tulis spesifikasi sebagai Nama: Nilai, satu spesifikasi per baris.', errors: { specs: ['Format spesifikasi tidak valid.'] } };
      specs[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    const input = produkAdminSchema.parse({
      ...fields(form), isActive: checked(form, 'isActive'), isFeatured: checked(form, 'isFeatured'), isPreorder: checked(form, 'isPreorder'),
      variants: decode(form, 'variants'), specs, tags: text(form, 'tags').split(',').map((s) => s.trim()).filter(Boolean), images: decode(form, 'retainedImages'),
    });
    const uploads = await verifikasiTokenGambar(tokens(form), admin.id, 'product', 8);
    if (input.images.length + uploads.length > 8) return { errors: { images: ['Maksimal 8 gambar per produk.'] }, message: 'Maksimal 8 gambar per produk.' };
    if (!input.images.length && !uploads.length) return { errors: { images: ['Tambahkan setidaknya satu gambar.'] }, message: 'Produk harus memiliki gambar.' };
    const urls = [...input.images, ...uploads];
    if (new Set(urls).size !== urls.length) throw new Error('Gambar tidak boleh berulang.');
    const { id, dilepas } = await prisma.$transaction(async (tx) => {
      const { variants } = input;
      const productData = { name: input.name, slug: input.slug, description: input.description, brand: input.brand, categoryId: input.categoryId, price: input.price, compareAtPrice: input.compareAtPrice, specs: input.specs, tags: input.tags, weight: input.weight, isActive: input.isActive, isFeatured: input.isFeatured, isPreorder: input.isPreorder, variantLabel: input.variantLabel || null, stock: variants.length ? variants.reduce((sum, v) => sum + v.stock, 0) : input.stock };
      if (productData.stock > 2_000_000_000) throw new Error('Total stok varian terlalu besar.');
      let product: { id: number };
      if (input.id) {
        // UPDATE memperoleh lock baris yang sama dengan checkout dan sekaligus
        // menolak formulir lama; seluruh relasi dibaca setelah lock diperoleh.
        const result = await tx.product.updateMany({ where: { id: input.id, updatedAt: new Date(input.version!) }, data: productData });
        if (result.count !== 1) throw new Error('Produk atau stok telah berubah. Muat ulang halaman sebelum menyimpan kembali.');
        product = { id: input.id };
      } else product = await tx.product.create({ data: productData, select: { id: true } });
      const existing = await tx.product.findUniqueOrThrow({ where: { id: product.id }, select: { images: { select: { url: true } }, variants: { select: { id: true, _count: { select: { orderItems: true } } } } } });
      if (variants.length && existing.variants.length === 0) {
        // Old simple items restore stock on the parent when cancelled. A new
        // variant cannot receive that reservation without an explicit mapping.
        const outstanding = await tx.orderItem.count({ where: { productId: product.id, variantId: null, order: { status: { in: ['pending', 'confirmed'] } } } });
        if (outstanding) throw new Error('Pesanan nonvarian masih dapat dibatalkan. Selesaikan atau batalkan pesanan tersebut sebelum menambahkan varian.');
      }
      if (input.images.some((url) => !existing.images.some((image) => image.url === url))) throw new Error('Gambar yang dipertahankan tidak ditemukan pada produk ini.');
      if (input.variants.some((variant) => variant.id !== null && !existing.variants.some((v) => v.id === variant.id))) throw new Error('Varian tidak ditemukan pada produk ini.');
      const removed = existing.variants.filter((v) => !input.variants.some((n) => n.id === v.id));
      if (removed.some((v) => v._count.orderItems > 0)) throw new Error('Varian yang pernah dipesan harus tetap disimpan. Atur stok menjadi 0 untuk menghentikan penjualan.');
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      await tx.productImage.createMany({ data: urls.map((url, sortOrder) => ({ productId: product.id, url, sortOrder })) });
      if (removed.length) {
        const result = await tx.productVariant.deleteMany({ where: { productId: product.id, id: { in: removed.map((v) => v.id) }, orderItems: { none: {} } } });
        if (result.count !== removed.length) throw new Error('Varian telah dipakai pesanan. Muat ulang dan pertahankan varian tersebut.');
      }
      // Set varian dalam satu transaksi; ID yang pernah dipesan tetap dipertahankan.
      for (const [sortOrder, variant] of variants.entries()) {
        const { id: variantId, ...value } = variant;
        if (variantId) await tx.productVariant.update({ where: { id: variantId, productId: product.id }, data: { ...value, sortOrder } });
        else await tx.productVariant.create({ data: { ...value, productId: product.id, sortOrder } });
      }
      return { id: product.id, dilepas: existing.images.map((image) => image.url).filter((url) => !urls.includes(url)) };
    });
    refresh();
    bersihkanGambar(dilepas);
    return { success: true, message: 'Produk berhasil disimpan.', id };
  } catch (error) { return failure(error); }
}

export async function arsipkanProdukAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireAdmin('/admin/produk');
  try {
    const id = idAdminSchema.parse(form.get('id'));
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    refresh(); return { success: true, message: 'Produk berhasil diarsipkan.' };
  } catch (error) { return failure(error); }
}

export async function simpanKategoriAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin('/admin/kategori');
  try {
    const input = kategoriAdminSchema.parse(fields(form));
    const image = (await verifikasiTokenGambar(tokens(form), admin.id, 'category', 1))[0];
    const gambarLama = await prisma.$transaction(async (tx) => {
      const categories = await tx.category.findMany({ select: { id: true, parentId: true } });
      let ancestor = input.parentId;
      const visited = new Set<number>();
      while (ancestor !== null) {
        if (ancestor === input.id || visited.has(ancestor)) throw new Error('Kategori tidak boleh menjadi anak dari dirinya sendiri.');
        visited.add(ancestor);
        const category = categories.find((c) => c.id === ancestor);
        if (!category) throw new Error('Kategori induk tidak ditemukan.');
        ancestor = category.parentId;
      }
      const { id, ...data } = input;
      if (!id) { await tx.category.create({ data: { ...data, image } }); return null; }
      const lama = image ? (await tx.category.findUnique({ where: { id }, select: { image: true } }))?.image : null;
      await tx.category.update({ where: { id }, data: { ...data, ...(image ? { image } : {}) } });
      return lama;
    }, { isolationLevel: 'Serializable' });
    refresh(); bersihkanGambar([gambarLama]); return { success: true, message: 'Kategori berhasil disimpan.' };
  } catch (error) { return failure(error); }
}
export async function hapusKategoriAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireAdmin('/admin/kategori');
  try {
    const terhapus = await prisma.category.delete({ where: { id: idAdminSchema.parse(form.get('id')) }, select: { image: true } });
    refresh(); bersihkanGambar([terhapus.image]); return { success: true, message: 'Kategori berhasil dihapus.' };
  } catch (error) { return failure(error); }
}

export async function simpanPromoAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireAdmin('/admin/promo');
  try {
    // datetime-local di formulir memakai WIB, bukan zona waktu mesin server.
    const input = promoAdminSchema.parse({ ...fields(form), code: text(form, 'code').toUpperCase(), isActive: checked(form, 'isActive'), startsAt: `${text(form, 'startsAt')}:00+07:00`, expiresAt: `${text(form, 'expiresAt')}:00+07:00` });
    const existingCode = text(form, 'existingCode');
    if (existingCode && input.code !== existingCode) throw new Error('Kode promo yang sudah dibuat tidak dapat diubah.');
    if (existingCode) {
      // Kuota baru tidak boleh lebih rendah dari jumlah pemakaian yang telah terjadi.
      const result = await prisma.promoCode.updateMany({ where: { code: existingCode, ...(input.quota !== null ? { usedCount: { lte: input.quota } } : {}) }, data: input });
      if (!result.count) throw new Error('Kuota tidak boleh kurang dari jumlah pemakaian, atau promo tidak ditemukan.');
    } else await prisma.promoCode.create({ data: input });
    refresh(); return { success: true, message: 'Kode promo berhasil disimpan.' };
  } catch (error) { return failure(error); }
}
export async function hapusPromoAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireAdmin('/admin/promo');
  try {
    const code = promoAdminSchema.shape.code.parse(form.get('code'));
    const result = await prisma.promoCode.deleteMany({ where: { code, usedCount: 0, usages: { none: {} } } });
    if (!result.count) throw new Error('Promo pernah digunakan. Nonaktifkan promo untuk menjaga riwayat pesanan.');
    refresh(); return { success: true, message: 'Kode promo berhasil dihapus.' };
  } catch (error) { return failure(error); }
}

export async function simpanBannerAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin('/admin/banner');
  try {
    const input = bannerAdminSchema.parse({ ...fields(form), isActive: checked(form, 'isActive') });
    const image = (await verifikasiTokenGambar(tokens(form), admin.id, 'banner', 1))[0];
    if (!input.id && !image) return { message: 'Tambahkan gambar banner.', errors: { images: ['Gambar banner wajib diisi.'] } };
    const { id, ...data } = input;
    let gambarLama: string | null = null;
    if (id) {
      gambarLama = image ? (await prisma.banner.findUnique({ where: { id }, select: { image: true } }))?.image ?? null : null;
      await prisma.banner.update({ where: { id }, data: { ...data, ...(image ? { image } : {}) } });
    } else await prisma.banner.create({ data: { ...data, image: image! } });
    refresh(); bersihkanGambar([gambarLama]); return { success: true, message: 'Banner berhasil disimpan.' };
  } catch (error) { return failure(error); }
}
export async function hapusBannerAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireAdmin('/admin/banner');
  try {
    const terhapus = await prisma.banner.delete({ where: { id: idAdminSchema.parse(form.get('id')) }, select: { image: true } });
    refresh(); bersihkanGambar([terhapus.image]); return { success: true, message: 'Banner berhasil dihapus.' };
  } catch (error) { return failure(error); }
}

export async function ubahStatusAdmin(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  const admin = await requireAdmin('/admin/pesanan');
  try {
    const input = statusAdminSchema.parse(fields(form));
    await ubahStatus(input.orderId, input.status, 'admin', { alasan: input.alasan, trackingNumber: input.trackingNumber, changedById: admin.id });
    refresh(); return { success: true, message: 'Status pesanan berhasil diperbarui.' };
  } catch (error) { return failure(error); }
}
