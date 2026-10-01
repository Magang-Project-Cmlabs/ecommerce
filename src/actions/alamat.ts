'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/akses';
import { alamatSchema, type AlamatInput } from '@/lib/validations/alamat';
import { prisma } from '@/lib/db';
import { BusinessValidationError, cobaUlangTransaksi, pesanGalat } from '@/lib/pesanan/galat';
export type HasilSimpanAlamat = { ok: true; addressId: number } | { ok: false; errors?: Partial<Record<keyof AlamatInput, string[]>>; message?: string };
const idSchema = z.number().int().positive();
function refresh() { revalidatePath('/checkout'); revalidatePath('/akun'); }
async function save(userId: number, input: AlamatInput, id?: number): Promise<HasilSimpanAlamat> {
  const parsed = alamatSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors, message: 'Mohon periksa kembali isian formulir alamat.' };
  if (id !== undefined && !idSchema.safeParse(id).success) return { ok: false, message: 'ID alamat tidak valid.' };
  try {
    const result = await cobaUlangTransaksi(() => prisma.$transaction(async tx => {
      const active = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM users WHERE id = ${userId} AND deleted_at IS NULL FOR UPDATE`;
      if (!active.length) throw new BusinessValidationError('Akun sudah tidak aktif. Silakan masuk kembali.');
      const existing = id ? await tx.address.findFirst({ where: { id, userId } }) : null;
      if (id && !existing) throw new BusinessValidationError('Alamat tidak ditemukan.');
      const count = await tx.address.count({ where: { userId } });
      // Preserve the sole/default address until another is explicitly made default.
      const isDefault = Boolean(parsed.data.isDefault || count === 0 || existing?.isDefault);
      if (isDefault) await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      const data = { ...parsed.data, isDefault };
      return id ? tx.address.update({ where: { id, userId }, data }) : tx.address.create({ data: { ...data, userId } });
    }, { isolationLevel: 'ReadCommitted' }));
    refresh();
    return { ok: true, addressId: result.id };
  } catch (error) { return { ok: false, message: pesanGalat(error, 'Alamat belum tersimpan. Silakan coba kembali.') }; }
}
export async function simpanAlamat(input: AlamatInput): Promise<HasilSimpanAlamat> { const user = await requireUser('/checkout'); return save(user.id, input); }
export async function updateAlamat(id: number, input: AlamatInput): Promise<HasilSimpanAlamat> { const user = await requireUser('/akun'); return save(user.id, input, id); }
export async function hapusAlamat(id: number): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser('/akun');
  if (!idSchema.safeParse(id).success) return { ok: false, message: 'ID alamat tidak valid.' };
  try {
    await cobaUlangTransaksi(() => prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const address = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!address) throw new BusinessValidationError('Alamat tidak ditemukan.');
      await tx.address.delete({ where: { id, userId: user.id } });
      if (address.isDefault) {
        const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { id: 'asc' } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }, { isolationLevel: 'ReadCommitted' }));
    refresh(); return { ok: true };
  } catch (error) { return { ok: false, message: pesanGalat(error, 'Alamat belum terhapus. Silakan coba kembali.') }; }
}
export async function setAlamatUtama(id: number): Promise<{ ok: boolean; message?: string }> {
  const user = await requireUser('/akun');
  if (!idSchema.safeParse(id).success) return { ok: false, message: 'ID alamat tidak valid.' };
  try {
    await cobaUlangTransaksi(() => prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const address = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!address) throw new BusinessValidationError('Alamat tidak ditemukan.');
      await tx.address.updateMany({ where: { userId: user.id, isDefault: true }, data: { isDefault: false } });
      await tx.address.update({ where: { id, userId: user.id }, data: { isDefault: true } });
    }, { isolationLevel: 'ReadCommitted' }));
    refresh(); return { ok: true };
  } catch (error) { return { ok: false, message: pesanGalat(error, 'Alamat utama belum berubah. Silakan coba kembali.') }; }
}
