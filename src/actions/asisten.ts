'use server';

// Asisten AI publik (D18). Tidak butuh login dan tidak membaca data akun/pesanan apa pun:
// hanya data toko publik + pertanyaan pengguna. Dibatasi per IP; pesan berisi data sensitif
// dihentikan sebelum dikirim ke model.

import { headers } from 'next/headers';
import { ipKlien } from '@/lib/auth/ip';
import { driverBatasAuth } from '@/lib/auth/batas-percobaan';
import { catatBatasAsisten } from '@/lib/asisten/pembatas';
import { daftarPenyedia, mintaJawaban, type PesanChat } from '@/lib/asisten/penyedia';
import { periksaPesanSensitif, susunInstruksi } from '@/lib/asisten/pengetahuan';
import { ambilDataAsisten } from '@/lib/data/asisten';
import { pesanAsistenSchema } from '@/lib/validations/asisten';

export type HasilAsisten = { ok: true; jawaban: string } | { ok: false; pesan: string };

const BELUM_TERSEDIA = 'Asisten belum tersedia. Coba lagi beberapa saat atau buka Pusat Bantuan.';

export async function tanyaAsisten(input: unknown): Promise<HasilAsisten> {
  const hasil = pesanAsistenSchema.safeParse(input);
  if (!hasil.success) return { ok: false, pesan: 'Pertanyaan belum bisa dikirim. Tulis pertanyaan maksimal 600 karakter.' };
  const riwayat = hasil.data.riwayat.slice(-8);
  const pertanyaan = riwayat.at(-1)!.isi;

  const tolak = periksaPesanSensitif(pertanyaan);
  if (tolak) return { ok: true, jawaban: tolak };

  const h = await headers();
  const ip = ipKlien(h);
  if (!ip && driverBatasAuth() === 'database') return { ok: false, pesan: BELUM_TERSEDIA };
  if (ip) {
    try {
      const batas = await catatBatasAsisten(ip);
      if (!batas.boleh) return { ok: false, pesan: `Terlalu banyak pertanyaan. Coba lagi dalam ${Math.max(1, Math.ceil(batas.tungguDetik / 60))} menit.` };
    } catch {
      console.error('[asisten] pembatas belum tersedia');
      return { ok: false, pesan: BELUM_TERSEDIA };
    }
  }

  let instruksi: string;
  try { instruksi = susunInstruksi(await ambilDataAsisten()); }
  catch {
    console.error('[asisten] data toko belum dapat dibaca');
    return { ok: false, pesan: BELUM_TERSEDIA };
  }

  // Pesan lama yang memuat data sensitif tidak pernah dikirim ulang ke model.
  const pesan: PesanChat[] = [
    { role: 'system', content: instruksi },
    ...riwayat.filter((m) => m.peran === 'asisten' || !periksaPesanSensitif(m.isi)).map((m): PesanChat => ({ role: m.peran === 'pengguna' ? 'user' : 'assistant', content: m.isi })),
  ];
  const jawaban = await mintaJawaban(pesan, daftarPenyedia());
  if (!jawaban.ok) {
    return {
      ok: false,
      pesan: jawaban.alasan === 'tidak-aktif' ? 'Asisten AI belum aktif di lingkungan ini. Silakan buka Pusat Bantuan.'
        : jawaban.alasan === 'sibuk' ? 'Asisten sedang ramai. Coba lagi sebentar lagi.'
          : 'Asisten belum bisa menjawab. Coba lagi atau buka Pusat Bantuan.',
    };
  }
  return { ok: true, jawaban: jawaban.jawaban.slice(0, 3000) };
}
