'use server';

// Daftar, masuk, keluar, lupa & reset password (kartu kvnlhm · Hari 2).
// Masuk, daftar, dan lupa password dibatasi 5 percobaan / 15 menit per IP
// (PRD §13, OPEN_DECISIONS D4). Percobaan dihitung setelah lolos validasi Zod,
// yaitu saat mulai menyentuh database/bcrypt.

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import { batasAuth, pesanTerlaluSering } from '@/lib/auth/batas-percobaan';
import { ipKlien } from '@/lib/auth/ip';
import { cocokkanPassword, cocokkanPasswordPalsu, hashPassword } from '@/lib/auth/password';
import { hapusSesi, simpanSesi } from '@/lib/auth/sesi';
import { MASA_TOKEN_RESET_MS, buatTokenReset, hashTokenReset } from '@/lib/auth/token-reset';
import { buatAkunPembeli, cariAkunUntukMasuk } from '@/lib/data/pengguna';
import { cariAkunUntukReset, pakaiTokenReset, simpanTokenReset } from '@/lib/data/reset-password';
import { kirimEmail } from '@/lib/email';
import { emailResetPassword } from '@/lib/email/templat';
import { urlAplikasi } from '@/lib/url-aplikasi';
import { amanNext, daftarSchema, lupaPasswordSchema, masukSchema, resetPasswordSchema } from '@/lib/validations/auth';

export type StateFormAkun =
  | {
      errors?: Partial<Record<string, string[]>>;
      message?: string;
      /** Isian yang dikembalikan ke form saat gagal. Password tidak pernah ikut. */
      values?: { name?: string; email?: string; phone?: string };
      /** Lupa password: permintaan diterima (pesan sama untuk email terdaftar atau tidak). */
      terkirim?: boolean;
    }
  | undefined;

const teks = (formData: FormData, nama: string) => {
  const v = formData.get(nama);
  return typeof v === 'string' ? v : undefined;
};

/** Catat satu percobaan untuk aksi ini dari IP peminta. */
async function catatPercobaan(aksi: 'masuk' | 'daftar' | 'lupa-password') {
  const kunci = `${aksi}:${ipKlien(await headers())}`;
  return { kunci, ...batasAuth.catat(kunci) };
}

export async function daftar(_: StateFormAkun, formData: FormData): Promise<StateFormAkun> {
  const values = { name: teks(formData, 'name'), email: teks(formData, 'email'), phone: teks(formData, 'phone') };
  const hasil = daftarSchema.safeParse({
    ...values,
    password: teks(formData, 'password'),
    confirmPassword: teks(formData, 'confirmPassword'),
    agree: teks(formData, 'agree'),
  });
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors, values };

  const batas = await catatPercobaan('daftar');
  if (!batas.boleh) return { message: pesanTerlaluSering(batas.tungguDetik), values };

  const { name, email, phone, password } = hasil.data;
  let akun: { id: number; role: 'customer' | 'admin' };
  try {
    akun = await buatAkunPembeli({ name, email, phone, passwordHash: await hashPassword(password) });
  } catch (e) {
    // Email unik (juga menangkap dua pendaftaran bersamaan dengan email sama).
    // Pesan ini sengaja mengonfirmasi email terdaftar — risiko enumerasi yang
    // diterima sadar (OPEN_DECISIONS); mitigasinya rate limit /daftar.
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

  const batas = await catatPercobaan('masuk');
  if (!batas.boleh) return { message: pesanTerlaluSering(batas.tungguDetik), values };

  const { email, password } = hasil.data;
  const akun = await cariAkunUntukMasuk(email);
  // Pesan dan lama respons sama untuk "email tidak terdaftar", "akun dihapus",
  // dan "password salah", supaya daftar akun tidak bisa ditebak.
  const cocok =
    akun && !akun.deletedAt ? await cocokkanPassword(password, akun.passwordHash) : await cocokkanPasswordPalsu(password);
  if (!akun || akun.deletedAt || !cocok) return { message: GAGAL_MASUK, values };

  batasAuth.hapus(batas.kunci); // pengguna sah tidak ikut terkunci oleh salah ketiknya sendiri
  await simpanSesi({ userId: akun.id, role: akun.role });
  redirect(amanNext(teks(formData, 'next')) ?? '/');
}

export async function keluar(): Promise<void> {
  await hapusSesi();
  redirect('/');
}

export async function lupaPassword(_: StateFormAkun, formData: FormData): Promise<StateFormAkun> {
  const values = { email: teks(formData, 'email') };
  const hasil = lupaPasswordSchema.safeParse(values);
  if (!hasil.success) return { errors: z.flattenError(hasil.error).fieldErrors, values };

  const batas = await catatPercobaan('lupa-password');
  if (!batas.boleh) return { message: pesanTerlaluSering(batas.tungguDetik), values };

  // Pencarian akun, pembuatan token, dan pengiriman email berjalan SETELAH
  // respons terkirim: isi maupun lama respons sama untuk email terdaftar dan
  // tidak terdaftar (PRD §10.9), sehingga daftar akun tidak bisa ditebak.
  const { email } = hasil.data;
  after(() => kirimLinkReset(email));
  return { terkirim: true, values };
}

async function kirimLinkReset(email: string): Promise<void> {
  try {
    const akun = await cariAkunUntukReset(email);
    if (!akun) return;
    const { token, tokenHash } = buatTokenReset();
    const disimpan = await simpanTokenReset(akun.id, tokenHash, new Date(Date.now() + MASA_TOKEN_RESET_MS));
    if (!disimpan) return; // baru saja meminta; link sebelumnya masih berlaku
    const url = `${urlAplikasi(process.env)}/reset-password?token=${token}`;
    await kirimEmail(akun.email, emailResetPassword({ nama: akun.name, url }));
  } catch (e) {
    console.error('[lupa password] gagal memproses permintaan:', e instanceof Error ? e.message : e);
  }
}

const LINK_TIDAK_BERLAKU = 'Link reset tidak berlaku lagi. Minta link baru di halaman Lupa password.';

export async function resetPassword(_: StateFormAkun, formData: FormData): Promise<StateFormAkun> {
  const hasil = resetPasswordSchema.safeParse({
    token: teks(formData, 'token'),
    password: teks(formData, 'password'),
    confirmPassword: teks(formData, 'confirmPassword'),
  });
  if (!hasil.success) {
    const errors = z.flattenError(hasil.error).fieldErrors;
    if (errors.token) return { message: LINK_TIDAK_BERLAKU };
    return { errors };
  }

  const { token, password } = hasil.data;
  const berhasil = await pakaiTokenReset(hashTokenReset(token), await hashPassword(password));
  if (!berhasil) return { message: LINK_TIDAK_BERLAKU };

  // Sesi lama di browser ini (bila ada) ikut dibuang; pengguna masuk ulang
  // dengan password baru.
  await hapusSesi();
  redirect('/masuk?reset=berhasil');
}
