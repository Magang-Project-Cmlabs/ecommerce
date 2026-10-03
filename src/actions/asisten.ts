'use server';

// Asisten AI publik (D18). Tidak butuh login dan tidak membaca data akun/pesanan apa pun:
// hanya data toko publik + pertanyaan pengguna. Model tidak diberi alat (tools), akses database,
// atau internet; satu-satunya keluarannya adalah teks. Pengaman berlapis:
// tombol darurat ASISTEN_NONAKTIF → validasi Zod (panjang & riwayat) → penyaring data sensitif →
// pembatas per pengguna/IP + harian + global → cache jawaban umum → model dengan instruksi topik ketat.

import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { ipKlien } from '@/lib/auth/ip';
import { driverBatasAuth } from '@/lib/auth/batas-percobaan';
import { catatBatasAsisten } from '@/lib/asisten/pembatas';
import { daftarPenyedia, mintaJawaban, type PesanChat } from '@/lib/asisten/penyedia';
import { periksaPesanSensitif, susunInstruksi } from '@/lib/asisten/pengetahuan';
import { ambilDataAsisten } from '@/lib/data/asisten';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { pesanAsistenSchema } from '@/lib/validations/asisten';

export type HasilAsisten = { ok: true; jawaban: string } | { ok: false; pesan: string };

const BELUM_TERSEDIA = 'Asisten belum tersedia. Coba lagi beberapa saat atau buka Pusat Bantuan.';
type Alasan = 'tidak-aktif' | 'sibuk' | 'gagal';
const PESAN_GAGAL: Record<Alasan, string> = {
  'tidak-aktif': 'Asisten AI belum aktif di lingkungan ini. Silakan buka Pusat Bantuan.',
  sibuk: 'Asisten sedang ramai. Coba lagi sebentar lagi.',
  gagal: 'Asisten belum bisa menjawab. Coba lagi atau buka Pusat Bantuan.',
};

class GagalAsisten extends Error { constructor(readonly alasan: Alasan) { super(alasan); } }

async function jawabModel(pesan: PesanChat[]): Promise<string> {
  const hasil = await mintaJawaban(pesan, daftarPenyedia());
  if (!hasil.ok) throw new GagalAsisten(hasil.alasan);
  return hasil.jawaban.slice(0, 3000);
}

// Pertanyaan pembuka yang sama (mis. tombol saran) dijawab dari cache 1 jam: hemat kuota gratis.
// Hanya jawaban sukses yang tersimpan (galat dilempar, tidak di-cache). Ikut tag katalog sehingga
// perubahan produk/harga membuat cache segar.
function jawabPertanyaanUmum(instruksi: string, pertanyaan: string): Promise<string> {
  const kunci = pertanyaan.toLowerCase().replace(/\s+/g, ' ').trim();
  return unstable_cache(() => jawabModel([{ role: 'system', content: instruksi }, { role: 'user', content: pertanyaan }]),
    ['tokokita-asisten-jawaban-v1', kunci], { revalidate: 3600, tags: ['katalog-publik'] })();
}

export async function tanyaAsisten(input: unknown): Promise<HasilAsisten> {
  if (process.env.ASISTEN_NONAKTIF === '1') return { ok: false, pesan: 'Asisten sedang dinonaktifkan sementara. Silakan buka Pusat Bantuan.' };

  const hasil = pesanAsistenSchema.safeParse(input);
  if (!hasil.success) return { ok: false, pesan: 'Pertanyaan belum bisa dikirim. Tulis pertanyaan maksimal 600 karakter atau mulai percakapan baru.' };
  const riwayat = hasil.data.riwayat.slice(-8);
  const pertanyaan = riwayat.at(-1)!.isi;

  const tolak = periksaPesanSensitif(pertanyaan);
  if (tolak) return { ok: true, jawaban: tolak };

  // Identitas pembatas: pengguna login bila ada (adil untuk banyak orang di satu Wi-Fi), selain itu IP.
  const ip = ipKlien(await headers());
  let identitas: string | null = ip ? `ip:${ip}` : null;
  try { const pengguna = await ambilPenggunaSaatIni(); if (pengguna) identitas = `u:${pengguna.id}`; } catch { /* tetap pakai IP */ }
  if (!identitas && driverBatasAuth() === 'database') return { ok: false, pesan: BELUM_TERSEDIA };
  if (identitas) {
    try {
      const batas = await catatBatasAsisten(identitas);
      if (!batas.boleh) {
        const menit = Math.max(1, Math.ceil(batas.tungguDetik / 60));
        return { ok: false, pesan: batas.lingkup === 'global' ? 'Asisten sudah mencapai batas pemakaian hari ini. Coba lagi besok atau buka Pusat Bantuan.'
          : batas.lingkup === 'harian' ? 'Batas pertanyaan harian Anda sudah tercapai. Coba lagi besok atau buka Pusat Bantuan.'
            : `Terlalu banyak pertanyaan. Coba lagi dalam ${menit} menit.` };
      }
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

  try {
    if (riwayat.length === 1) return { ok: true, jawaban: await jawabPertanyaanUmum(instruksi, pertanyaan) };
    // Pesan lama yang memuat data sensitif tidak pernah dikirim ulang ke model.
    const pesan: PesanChat[] = [
      { role: 'system', content: instruksi },
      ...riwayat.filter((m) => m.peran === 'asisten' || !periksaPesanSensitif(m.isi)).map((m): PesanChat => ({ role: m.peran === 'pengguna' ? 'user' : 'assistant', content: m.isi })),
    ];
    return { ok: true, jawaban: await jawabModel(pesan) };
  } catch (e) {
    return { ok: false, pesan: PESAN_GAGAL[e instanceof GagalAsisten ? e.alasan : 'gagal'] };
  }
}
