// Cara email dikirim (OPEN_DECISIONS D6). Dipisah dari index.ts agar bisa
// diuji tanpa Nodemailer.

export type ModeKirim = 'smtp' | 'konsol' | 'tidak-dikonfigurasi';

export function modeKirim(env: { SMTP_HOST?: string; NODE_ENV?: string }): ModeKirim {
  if (env.SMTP_HOST?.trim()) return 'smtp';
  return env.NODE_ENV === 'production' ? 'tidak-dikonfigurasi' : 'konsol';
}
