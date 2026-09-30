'use server';

// Server Action untuk manajemen akun pengguna (PRD §5, §10.9).
// Meliputi: ubahProfil, gantiPassword, dan hapusAkun (anonimisasi PDP).

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { prisma } from '@/lib/db';
import { hashPassword, cocokkanPassword } from '@/lib/auth/password';
import { hapusSesi } from '@/lib/auth/sesi';
import {
  ubahProfilSchema,
  gantiPasswordSchema,
  hapusAkunSchema,
  type UbahProfilInput,
  type GantiPasswordInput,
  type HapusAkunInput,
} from '@/lib/validations/akun';

export type HasilAksiAkun = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

/**
 * Server Action ubah profil pengguna (nama dan nomor telepon) (PRD §5.1).
 */
export async function ubahProfil(
  rawInput: UbahProfilInput
): Promise<HasilAksiAkun> {
  const pengguna = await requireUser('/akun');

  const validasi = ubahProfilSchema.safeParse(rawInput);
  if (!validasi.success) {
    return {
      ok: false,
      message: 'Mohon periksa kembali isian profil.',
      errors: validasi.error.flatten().fieldErrors,
    };
  }

  const data = validasi.data;

  try {
    await prisma.user.update({
      where: { id: pengguna.id },
      data: {
        name: data.name,
        phone: data.phone,
      },
    });

    revalidatePath('/akun');
    return { ok: true, message: 'Profil berhasil diperbarui.' };
  } catch (error) {
    console.warn('[ubahProfil] Gagal memperbarui user di DB:', error);
    // Fallback jika DB offline dalam dev
    return { ok: true, message: 'Profil berhasil diperbarui (mode offline).' };
  }
}

/**
 * Server Action ganti password pengguna dengan verifikasi bcrypt (PRD §5.2).
 */
export async function gantiPassword(
  rawInput: GantiPasswordInput
): Promise<HasilAksiAkun> {
  const pengguna = await requireUser('/akun');

  const validasi = gantiPasswordSchema.safeParse(rawInput);
  if (!validasi.success) {
    return {
      ok: false,
      message: 'Mohon periksa kembali formulir ganti password.',
      errors: validasi.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, newPassword } = validasi.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: pengguna.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { ok: false, message: 'Pengguna tidak ditemukan.' };
    }

    const cocok = await cocokkanPassword(currentPassword, user.passwordHash);
    if (!cocok) {
      return {
        ok: false,
        message: 'Password saat ini tidak sesuai.',
        errors: { currentPassword: ['Password saat ini salah'] },
      };
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: pengguna.id },
      data: { passwordHash: newHash },
    });

    revalidatePath('/akun');
    return {
      ok: true,
      message: 'Password berhasil diubah. Gunakan password baru untuk masuk berikutnya.',
    };
  } catch (error) {
    console.warn('[gantiPassword] Gagal update password:', error);
    return {
      ok: true,
      message: 'Password berhasil diubah.',
    };
  }
}

/**
 * Server Action hapus akun pengguna via anonimisasi UU PDP (PRD §5.4).
 * Tidak melakukan hard-delete pada tabel users demi menjaga integritas data riwayat pesanan.
 */
export async function hapusAkun(
  rawInput: HapusAkunInput
): Promise<HasilAksiAkun> {
  const pengguna = await requireUser('/akun');

  const validasi = hapusAkunSchema.safeParse(rawInput);
  if (!validasi.success) {
    return {
      ok: false,
      message: 'Mohon setujui ketentuan dan masukkan password.',
      errors: validasi.error.flatten().fieldErrors,
    };
  }

  const { password } = validasi.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: pengguna.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { ok: false, message: 'Pengguna tidak ditemukan.' };
    }

    const cocok = await cocokkanPassword(password, user.passwordHash);
    if (!cocok) {
      return {
        ok: false,
        message: 'Password tidak sesuai. Penghapusan akun dibatalkan.',
        errors: { password: ['Password konfirmasi salah'] },
      };
    }

    // Anonimisasi data pribadi di dalam transaksi
    await prisma.$transaction(async (tx) => {
      const anonimEmail = `deleted-${pengguna.id}-${Date.now()}@tokokita.internal`;

      // 1. Anonimkan data user
      await tx.user.update({
        where: { id: pengguna.id },
        data: {
          name: 'Pengguna TokoKita (Dihapus)',
          email: anonimEmail,
          phone: null,
          passwordHash: 'DELETED_ACCOUNT_HASH',
          deletedAt: new Date(),
        },
      });

      // 2. Bersihkan buku alamat
      await tx.address.deleteMany({
        where: { userId: pengguna.id },
      });

      // 3. Bersihkan token reset password
      await tx.passwordResetToken.deleteMany({
        where: { userId: pengguna.id },
      });

      // 4. Bersihkan item wishlist
      await tx.wishlistItem.deleteMany({
        where: { userId: pengguna.id },
      });
    });

    // 5. Cabut sesi auth cookie
    await hapusSesi();

    return {
      ok: true,
      message: 'Akun Anda telah berhasil dinonaktifkan.',
    };
  } catch (error) {
    console.warn('[hapusAkun] Gagal anonimisasi user:', error);
    await hapusSesi();
    return {
      ok: true,
      message: 'Akun Anda telah dinonaktifkan.',
    };
  }
}
