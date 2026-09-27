// Pengirim email (PRD §11, Nodemailer SMTP). Tanpa SMTP_HOST di development,
// isi email dicetak ke konsol server (OPEN_DECISIONS D6). Pemanggil mengirim
// SETELAH transaksi commit; kegagalan kirim dicatat, tidak membatalkan aksi.

import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { modeKirim } from './mode';
import type { IsiEmail } from './templat';

let transport: Transporter | undefined;

function ambilTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

/** Kirim satu email. Mengembalikan false bila gagal (sudah dicatat, tanpa isi email). */
export async function kirimEmail(kepada: string, isi: IsiEmail): Promise<boolean> {
  const mode = modeKirim(process.env);
  if (mode === 'konsol') {
    console.info(`\n[email dev] kepada: ${kepada}\n[email dev] subjek: ${isi.subject}\n${isi.text}\n`);
    return true;
  }
  if (mode === 'tidak-dikonfigurasi') {
    console.error('[email] SMTP_HOST belum diisi; email tidak dikirim:', isi.subject);
    return false;
  }
  try {
    await ambilTransport().sendMail({
      from: process.env.MAIL_FROM || 'TokoKita <no-reply@example.com>',
      to: kepada,
      subject: isi.subject,
      text: isi.text,
      html: isi.html,
    });
    return true;
  } catch (e) {
    console.error('[email] gagal mengirim:', isi.subject, e instanceof Error ? e.message : e);
    return false;
  }
}
