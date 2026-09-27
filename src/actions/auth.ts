'use server';

// Daftar, masuk, dan keluar (kartu kvnlhm · Hari 2). Batas 5 percobaan masuk
// per 15 menit (PRD §13) dikerjakan di kartu "Fitur lupa password".

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { cocokkanPassword, cocokkanPasswordPalsu, hashPassword } from '@/lib/auth/password';
import { hapusSesi, simpanSesi } from '@/lib/auth/sesi';
import { buatAkunPembeli, cariAkunUntukMasuk } from '@/lib/data/pengguna';
import { amanNext, daftarSchema, masukSchema } from '@/lib/validations/auth';

export type StateFormAkun =
  | {
      errors?: Partial<Record<string, string[]>>;
      message?: string;
      /** Isian yang dikembalikan ke form saat gagal. Password tidak pernah ikut. */
      values?: { name?: string; email?: string; phone?: string };
    }
  | undefined;

const teks = (formData: FormData, nama: string) => {
  const v = formData.get(nama);
  return typeof v === 'string' ? v : undefined;
};

export async function daftar(_: StateFormAkun, formData: FormData): Promise<StateFormAkun> {
  const values = { name: teks(formData, 'name'), email: teks(formData, 'email'), phone: teks(formData, 'phone') };
  const hasil = daftarSchema.safeParse({
    ...values,
    password: teks(formData, 'password'),
    confirmPassword: teks(formData, 'confirmPassword'),
    agree: teks(formData, 'agree'),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors, values };

  const { name, email, phone, password } = hasil.data;
  let akun: { id: number; role: 'customer' | 'admin' };
  try {
    akun = await buatAkunPembeli({ name, email, phone, passwordHash: await hashPassword(password) });
  } catch (e) {
    // Email unik (juga menangkap dua pendaftaran bersamaan dengan email sama)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { errors: { email: ['Email sudah terdaftar. Silakan masuk.'] }, values };
    }
    throw e;
  }

  await simpanSesi({ userId: akun.id, role: akun.role });
  redirect(amanNext(teks(formData, 'next')) ?? '/');
}

const GAGAL_MASUK = 'Email atau password salah';

export async function masuk(_: StateFormAkun, formData: FormData): Promise<StateFormAkun> {
  const values = { email: teks(formData, 'email') };
  const hasil = masukSchema.safeParse({ email: values.email, password: teks(formData, 'password') });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors, values };

  const { email, password } = hasil.data;
  const akun = await cariAkunUntukMasuk(email);
  // Pesan dan lama respons sama untuk "email tidak terdaftar", "akun dihapus",
  // dan "password salah", supaya daftar akun tidak bisa ditebak.
  const cocok =
    akun && !akun.deletedAt ? await cocokkanPassword(password, akun.passwordHash) : await cocokkanPasswordPalsu(password);
  if (!akun || akun.deletedAt || !cocok) return { message: GAGAL_MASUK, values };

  await simpanSesi({ userId: akun.id, role: akun.role });
  redirect(amanNext(teks(formData, 'next')) ?? '/');
}

export async function keluar(): Promise<void> {
  await hapusSesi();
  redirect('/');
}
