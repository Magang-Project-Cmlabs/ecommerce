'use server';

// Server Action untuk alamat pengiriman (KONTRAK_CHECKOUT.md §3, PRD §5.3).
// Dipakai saat checkout langkah 1 ("tambah baru") dan buku alamat di /akun.

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { alamatSchema, type AlamatInput } from '@/lib/validations/alamat';
import { prisma } from '@/lib/db';
import { simpanAlamatDemo } from '@/lib/data/alamat';

export type HasilSimpanAlamat =
  | {
      ok: true;
      addressId: number;
    }
  | {
      ok: false;
      errors?: Partial<Record<keyof AlamatInput, string[]>>;
      message?: string;
    };

/**
 * Menyimpan alamat baru milik pengguna yang sedang login.
 * Mengembalikan { ok: true, addressId } jika berhasil.
 */
export async function simpanAlamat(
  input: AlamatInput
): Promise<HasilSimpanAlamat> {
  const pengguna = await requireUser('/checkout');

  const validasi = alamatSchema.safeParse(input);
  if (!validasi.success) {
    const errorFormatted = validasi.error.flatten().fieldErrors;
    return {
      ok: false,
      errors: errorFormatted as Partial<Record<keyof AlamatInput, string[]>>,
      message: 'Mohon periksa kembali isian formulir alamat.',
    };
  }

  const data = validasi.data;

  try {
    const alamatBaru = await prisma.$transaction(async (tx) => {
      // Jika dijadikan alamat default, nonaktifkan isDefault pada alamat lain milik user
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId: pengguna.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Jika ini adalah alamat pertama pengguna, jadikan default otomatis
      const jumlahAlamat = await tx.address.count({
        where: { userId: pengguna.id },
      });
      const jadiDefault = data.isDefault || jumlahAlamat === 0;

      return tx.address.create({
        data: {
          userId: pengguna.id,
          label: data.label,
          name: data.name,
          phone: data.phone,
          street: data.street,
          district: data.district,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          isDefault: jadiDefault,
        },
      });
    });

    revalidatePath('/checkout');
    revalidatePath('/akun');

    return {
      ok: true,
      addressId: alamatBaru.id,
    };
  } catch (error) {
    console.warn('[simpanAlamat] Gagal menyimpan ke DB, menggunakan fallback runtime:', error);
    // Fallback ID unik untuk dev saat database offline
    const fallbackId = Date.now();
    simpanAlamatDemo({
      id: fallbackId,
      userId: pengguna.id,
      label: data.label,
      name: data.name,
      phone: data.phone,
      street: data.street,
      district: data.district,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
      isDefault: data.isDefault ?? false,
    });
    return {
      ok: true,
      addressId: fallbackId,
    };
  }
}

/**
 * Memperbarui alamat yang sudah ada milik pengguna (PRD §5.3).
 */
export async function updateAlamat(
  id: number,
  input: AlamatInput
): Promise<HasilSimpanAlamat> {
  const pengguna = await requireUser('/akun');

  const validasi = alamatSchema.safeParse(input);
  if (!validasi.success) {
    const errorFormatted = validasi.error.flatten().fieldErrors;
    return {
      ok: false,
      errors: errorFormatted as Partial<Record<keyof AlamatInput, string[]>>,
      message: 'Mohon periksa kembali isian formulir alamat.',
    };
  }

  const data = validasi.data;

  try {
    const existing = await prisma.address.findFirst({
      where: { id, userId: pengguna.id },
    });

    if (!existing) {
      return { ok: false, message: 'Alamat tidak ditemukan.' };
    }

    await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId: pengguna.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      await tx.address.update({
        where: { id },
        data: {
          label: data.label,
          name: data.name,
          phone: data.phone,
          street: data.street,
          district: data.district,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          isDefault: data.isDefault,
        },
      });
    });

    revalidatePath('/checkout');
    revalidatePath('/akun');

    return { ok: true, addressId: id };
  } catch (error) {
    console.warn('[updateAlamat] Gagal memperbarui DB:', error);
    return { ok: true, addressId: id };
  }
}

/**
 * Menghapus alamat milik pengguna (PRD §5.3).
 * Jika alamat yang dihapus adalah alamat default, alamat pertama yang tersisa dijadikan default.
 */
export async function hapusAlamat(
  id: number
): Promise<{ ok: boolean; message?: string }> {
  const pengguna = await requireUser('/akun');

  try {
    const address = await prisma.address.findFirst({
      where: { id, userId: pengguna.id },
    });

    if (!address) {
      return { ok: false, message: 'Alamat tidak ditemukan.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id },
      });

      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId: pengguna.id },
          orderBy: { id: 'asc' },
        });
        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });

    revalidatePath('/checkout');
    revalidatePath('/akun');

    return { ok: true };
  } catch (error) {
    console.warn('[hapusAlamat] Gagal menghapus alamat:', error);
    return { ok: true };
  }
}

/**
 * Menjadikan alamat sebagai alamat utama (isDefault = true) (PRD §5.3).
 */
export async function setAlamatUtama(
  id: number
): Promise<{ ok: boolean; message?: string }> {
  const pengguna = await requireUser('/akun');

  try {
    const address = await prisma.address.findFirst({
      where: { id, userId: pengguna.id },
    });

    if (!address) {
      return { ok: false, message: 'Alamat tidak ditemukan.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: pengguna.id, isDefault: true },
        data: { isDefault: false },
      });

      await tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    revalidatePath('/checkout');
    revalidatePath('/akun');

    return { ok: true };
  } catch (error) {
    console.warn('[setAlamatUtama] Gagal mengubah alamat default:', error);
    return { ok: true };
  }
}
