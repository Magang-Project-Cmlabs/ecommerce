'use server';

// Asisten AI publik (D18) yang bisa membantu belanja (D23). Tidak butuh login dan tidak membaca data
// akun/alamat/pesanan apa pun: hanya data toko publik, pertanyaan pengguna, dan konteks belanja dari
// browser (halaman + isi keranjang) yang nama dan harganya dibaca ulang dari database.
// Model tidak diberi alat (tools), akses database, atau internet; keluarannya hanya teks. Penanda
// aksi di teks ([[produk:slug]] dst.) dicocokkan ke database dan dikembalikan sebagai usulan tombol;
// tidak ada yang dijalankan di server. Pengaman berlapis:
// tombol darurat ASISTEN_NONAKTIF → validasi Zod (panjang, riwayat, konteks) → penyaring data sensitif →
// pembatas per pengguna/IP + harian + global → cache jawaban umum → model dengan instruksi topik ketat.

import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { ipKlien } from '@/lib/auth/ip';
import { driverBatasAuth } from '@/lib/auth/batas-percobaan';
import { catatBatasAsisten } from '@/lib/asisten/pembatas';
import { daftarPenyedia, mintaJawaban, type PesanChat } from '@/lib/asisten/penyedia';
import { periksaPesanSensitif, susunInstruksi, type KonteksPembeli } from '@/lib/asisten/pengetahuan';
import { slugPenanda, susunAksi, uraiPenanda, type AksiAsisten } from '@/lib/asisten/aksi';
import { samarkanTeleponRiwayat } from '@/lib/asisten/telepon';
import { ambilDataAsisten, ambilProdukAksi } from '@/lib/data/asisten';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { pesanAsistenSchema, type PesanAsistenInput } from '@/lib/validations/asisten';

export type HasilAsisten = { ok: true; jawaban: string; aksi: AksiAsisten[] } | { ok: false; pesan: string };

const BELUM_TERSEDIA = 'Asisten belum tersedia. Coba lagi beberapa saat atau buka Pusat Bantuan.';
type Alasan = 'tidak-aktif' | 'sibuk' | 'gagal';
const PESAN_GAGAL: Record<Alasan, string> = {
  'tidak-aktif': 'Asisten AI belum aktif di lingkungan ini. Silakan buka Pusat Bantuan.',
  sibuk: 'Asisten sedang ramai. Coba lagi sebentar lagi.',
  gagal: 'Asisten belum bisa menjawab. Coba lagi atau buka Pusat Bantuan.',
};

const BATAS_CACHE = 80;

class GagalAsisten extends Error { constructor(readonly alasan: Alasan) { super(alasan); } }

async function jawabModel(pesan: PesanChat[]): Promise<string> {
  const hasil = await mintaJawaban(pesan, daftarPenyedia());
  if (!hasil.ok) throw new GagalAsisten(hasil.alasan);
  return hasil.jawaban.slice(0, 4000);
}

// Pertanyaan pembuka yang sama (mis. tombol saran) tanpa konteks belanja dijawab dari cache 1 jam:
// hemat kuota gratis. Yang di-cache teks mentah model (dengan penanda), sehingga kartu produk tetap
// dibaca segar dari database. Hanya jawaban sukses yang tersimpan; ikut tag katalog.
function jawabPertanyaanUmum(instruksi: string, pertanyaan: string): Promise<string> {
  const kunci = pertanyaan.toLowerCase().replace(/\s+/g, ' ').trim();
  return unstable_cache(() => jawabModel([{ role: 'system', content: instruksi }, { role: 'user', content: pertanyaan }]),
    ['tokokita-asisten-jawaban-v2', kunci], { revalidate: 3600, tags: ['katalog-publik'] })();
}

/** Konteks belanja dengan nama dan harga dari database. undefined bila tidak ada yang perlu diceritakan. */
async function bacaKonteks(k: PesanAsistenInput['konteks']): Promise<KonteksPembeli | undefined> {
  if (!k) return undefined;
  const checkout = k.halaman === '/checkout';
  const slugDilihat = /^\/produk\/([a-z0-9-]+)$/.exec(k.halaman ?? '')?.[1] ?? null;
  const slugs = [...new Set([...k.keranjang.map((i) => i.slug), ...(slugDilihat ? [slugDilihat] : [])])];
  if (!checkout && !slugs.length) return undefined;
  const perSlug = new Map((slugs.length ? await ambilProdukAksi(slugs) : []).map((p) => [p.slug, p]));
  const keranjang = k.keranjang.flatMap((i) => {
    const p = perSlug.get(i.slug);
    const v = i.varianId ? p?.variants.find((x) => x.id === i.varianId) : undefined;
    if (!p || (i.varianId && !v)) return [];
    return [{ name: p.name, varian: v?.name ?? null, jumlah: i.jumlah, harga: v?.price ?? p.price }];
  });
  const dilihat = slugDilihat ? perSlug.get(slugDilihat) : undefined;
  return { checkout, keranjang, dilihat: dilihat ? { name: dilihat.name, slug: dilihat.slug } : null };
}

/** Pisahkan penanda dari teks lalu cocokkan ke database. Gagal membaca produk = teks tanpa tombol. */
async function susunHasil(mentah: string): Promise<HasilAsisten> {
  const { teks, penanda } = uraiPenanda(mentah);
  let aksi: AksiAsisten[] = [];
  try {
    const slugs = slugPenanda(penanda);
    aksi = susunAksi(penanda, slugs.length ? await ambilProdukAksi(slugs) : []);
  } catch {
    console.error('[asisten] produk untuk aksi belum dapat dibaca');
  }
  if (!teks && !aksi.length) return { ok: false, pesan: PESAN_GAGAL.gagal };
  return { ok: true, jawaban: teks || 'Silakan pilih lewat tombol di bawah.', aksi };
}

export async function tanyaAsisten(input: unknown): Promise<HasilAsisten> {
  if (process.env.ASISTEN_NONAKTIF === '1') return { ok: false, pesan: 'Asisten sedang dinonaktifkan sementara. Silakan buka Pusat Bantuan.' };

  const hasil = pesanAsistenSchema.safeParse(input);
  if (!hasil.success) return { ok: false, pesan: 'Pertanyaan belum bisa dikirim. Tulis pertanyaan maksimal 600 karakter atau mulai percakapan baru.' };
  // Browser sudah menyamarkan nomor HP, tetapi klien tidak dipercaya: samarkan sekali lagi di sini.
  // Token buatan server tidak dikenal browser, sehingga nomor itu dikosongkan di draf alamat.
  const riwayat = samarkanTeleponRiwayat(hasil.data.riwayat.slice(-8)).riwayat;
  const pertanyaan = riwayat.at(-1)!.isi;

  const tolak = periksaPesanSensitif(pertanyaan);
  if (tolak) return { ok: true, jawaban: tolak, aksi: [] };

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

  // Konteks belanja hanya pelengkap: bila gagal dibaca, asisten tetap menjawab tanpa konteks.
  let konteks: KonteksPembeli | undefined;
  try { konteks = await bacaKonteks(hasil.data.konteks); } catch { console.error('[asisten] konteks belanja belum dapat dibaca'); }

  let instruksi: string;
  try { instruksi = susunInstruksi(await ambilDataAsisten(), konteks); }
  catch {
    console.error('[asisten] data toko belum dapat dibaca');
    return { ok: false, pesan: BELUM_TERSEDIA };
  }

  try {
    // Cache hanya untuk pertanyaan pembuka pendek (mis. tombol saran), supaya kunci cache tidak tumbuh bebas.
    if (riwayat.length === 1 && !konteks && pertanyaan.length <= BATAS_CACHE) return await susunHasil(await jawabPertanyaanUmum(instruksi, pertanyaan));
    // Pesan lama yang memuat data sensitif tidak pernah dikirim ulang ke model.
    const pesan: PesanChat[] = [
      { role: 'system', content: instruksi },
      ...riwayat.filter((m) => m.peran === 'asisten' || !periksaPesanSensitif(m.isi)).map((m): PesanChat => ({ role: m.peran === 'pengguna' ? 'user' : 'assistant', content: m.isi })),
    ];
    return await susunHasil(await jawabModel(pesan));
  } catch (e) {
    return { ok: false, pesan: PESAN_GAGAL[e instanceof GagalAsisten ? e.alasan : 'gagal'] };
  }
}
