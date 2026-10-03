'use server';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { ambilHashPassword } from '@/lib/data/pengguna';
import { prisma } from '@/lib/db';
import { hashPassword, cocokkanPassword } from '@/lib/auth/password';
import { versiPassword } from '@/lib/auth/password-version';
import { hapusSesi, simpanSesi } from '@/lib/auth/sesi';
import { ubahProfilSchema, gantiPasswordSchema, hapusAkunSchema, type UbahProfilInput, type GantiPasswordInput, type HapusAkunInput } from '@/lib/validations/akun';
export type HasilAksiAkun = { ok: boolean; message: string; errors?: Record<string, string[]> };
export async function ubahProfil(raw: UbahProfilInput): Promise<HasilAksiAkun> {
  const user = await requireUser('/akun');
  const parsed = ubahProfilSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Mohon periksa kembali isian profil.', errors: parsed.error.flatten().fieldErrors };
  try {
    const updated = await prisma.user.updateMany({ where: { id: user.id, deletedAt: null }, data: parsed.data });
    if (updated.count !== 1) return { ok: false, message: 'Akun tidak ditemukan.' };
    revalidatePath('/akun'); return { ok: true, message: 'Profil berhasil diperbarui.' };
  } catch { return { ok: false, message: 'Profil belum tersimpan. Silakan coba kembali.' }; }
}
export async function gantiPassword(raw: GantiPasswordInput): Promise<HasilAksiAkun> {
  const user = await requireUser('/akun');
  const parsed = gantiPasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Mohon periksa kembali formulir ganti password.', errors: parsed.error.flatten().fieldErrors };
  try {
    const current = await ambilHashPassword(user.id);
    if (!current || !await cocokkanPassword(parsed.data.currentPassword, current.passwordHash)) return { ok: false, message: 'Password saat ini tidak sesuai.', errors: { currentPassword: ['Password saat ini salah'] } };
    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.$transaction(async tx => {
      const changed = await tx.user.updateMany({ where: { id: user.id, deletedAt: null, passwordHash: current.passwordHash }, data: { passwordHash } });
      if (changed.count !== 1) throw new Error('Password changed');
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    });
    await simpanSesi({ userId: user.id, role: user.role, passwordVersion: versiPassword(passwordHash) });
    revalidatePath('/akun'); return { ok: true, message: 'Password berhasil diubah. Sesi lain telah dinonaktifkan.' };
  } catch { return { ok: false, message: 'Password belum berubah. Silakan coba kembali.' }; }
}
export async function hapusAkun(raw: HapusAkunInput): Promise<HasilAksiAkun> {
  const user = await requireUser('/akun');
  const parsed = hapusAkunSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Mohon setujui ketentuan dan masukkan password.', errors: parsed.error.flatten().fieldErrors };
  try {
    const current = await ambilHashPassword(user.id);
    if (!current || !await cocokkanPassword(parsed.data.password, current.passwordHash)) return { ok: false, message: 'Password tidak sesuai. Penghapusan akun dibatalkan.', errors: { password: ['Password konfirmasi salah'] } };
    const blockedHash = await hashPassword(randomBytes(32).toString('hex'));
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
      const changed = await tx.user.updateMany({ where: { id: user.id, deletedAt: null, passwordHash: current.passwordHash }, data: { name: 'Pengguna TokoKita (Dihapus)', email: `deleted-${user.id}@tokokita.invalid`, phone: null, passwordHash: blockedHash, googleSub: null, deletedAt: new Date() } });
      if (changed.count !== 1) throw new Error('Account changed');
      await tx.address.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.wishlistItem.deleteMany({ where: { userId: user.id } });
      // Retain accounting amounts/items, remove the personal delivery snapshots.
      await tx.order.updateMany({ where: { userId: user.id }, data: { shippingAddress: { name: 'Pengguna dihapus' }, notes: null, cancelReason: null } });
      // Free-text log notes can repeat addresses/phones/cancellation reasons.
      // Keep the status, actor and timestamps needed for accounting history.
      await tx.orderStatusLog.updateMany({ where: { order: { userId: user.id } }, data: { note: null } });
    });
  } catch { return { ok: false, message: 'Akun belum dihapus. Silakan coba kembali.' }; }
  await hapusSesi();
  return { ok: true, message: 'Akun Anda telah dinonaktifkan dan data pribadi dianonimkan.' };
}
