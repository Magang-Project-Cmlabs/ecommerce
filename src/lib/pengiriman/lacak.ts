// Lacak resi otomatis lewat API Binderbyte (D20). Server saja: kunci API tidak pernah
// dikirim ke browser. Tanpa LACAK_RESI_API_KEY fitur nonaktif dan resi tetap bisa disalin.
import 'server-only';
import type { KurirKode } from '@/lib/pesanan/ongkir';

export type RiwayatResi = { waktu: string | null; keterangan: string; lokasi: string | null };
export type HasilLacak =
  | { status: 'ok'; ringkasan: { status: string; keterangan: string | null }; riwayat: RiwayatResi[] }
  | { status: 'tidak-dikonfigurasi' }
  | { status: 'tidak-didukung' }
  | { status: 'tidak-ditemukan' }
  | { status: 'gagal' };

const KODE_KURIR: Partial<Record<KurirKode, string>> = { jne_reg: 'jne', sicepat_reg: 'sicepat' };
const POLA_RESI = /^[A-Za-z0-9-]{6,40}$/;
const ALAMAT_BAWAAN = 'https://api.binderbyte.com/v1/track';

export const lacakTersedia = () => !!process.env.LACAK_RESI_API_KEY?.trim();
export const kurirBisaDilacak = (kurir: string) => kurir in KODE_KURIR;

/** Status ringkasan kurir yang umum, dalam Bahasa Indonesia; selain ini ditampilkan apa adanya. */
const STATUS_KURIR: Record<string, string> = {
  'DELIVERED': 'Paket sudah diterima', 'ON PROCESS': 'Dalam pengiriman', 'ON DELIVERY': 'Sedang diantar kurir', 'IN TRANSIT': 'Dalam perjalanan',
  'PICKED UP': 'Sudah diambil kurir', 'MANIFESTED': 'Data paket diterima kurir', 'RETURNED': 'Dikembalikan ke pengirim', 'CANCELLED': 'Pengiriman dibatalkan',
};
export const statusKurir = (status: string) => STATUS_KURIR[status.trim().toUpperCase()] ?? status;

const teks = (nilai: unknown, maks = 300) => (typeof nilai === 'string' ? nilai.trim().slice(0, maks) : '');
/** Binderbyte memakai "YYYY-MM-DD HH:mm:ss" waktu Indonesia Barat. */
const waktuWib = (nilai: unknown) => {
  const t = teks(nilai, 40);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t) ? `${t.replace(' ', 'T')}+07:00` : null;
};

export async function lacakResi(kurir: string, resi: string, ambil: typeof fetch = fetch): Promise<HasilLacak> {
  const kunci = process.env.LACAK_RESI_API_KEY?.trim();
  if (!kunci) return { status: 'tidak-dikonfigurasi' };
  const kode = KODE_KURIR[kurir as KurirKode];
  if (!kode) return { status: 'tidak-didukung' };
  if (!POLA_RESI.test(resi)) return { status: 'tidak-ditemukan' };

  const url = new URL(process.env.LACAK_RESI_BASE_URL?.trim() || ALAMAT_BAWAAN);
  url.search = new URLSearchParams({ api_key: kunci, courier: kode, awb: resi }).toString();
  let isi: { status?: unknown; data?: { summary?: Record<string, unknown>; history?: unknown } };
  try {
    const respons = await ambil(url, { signal: AbortSignal.timeout(8_000), headers: { Accept: 'application/json' }, cache: 'no-store' });
    isi = await respons.json();
  } catch {
    return { status: 'gagal' };
  }
  if (Number(isi?.status) === 400) return { status: 'tidak-ditemukan' };
  if (Number(isi?.status) !== 200 || !Array.isArray(isi.data?.history)) return { status: 'gagal' };

  const riwayat = (isi.data.history as Record<string, unknown>[])
    .map((h) => ({ waktu: waktuWib(h?.date), keterangan: teks(h?.desc), lokasi: teks(h?.location, 100) || null }))
    .filter((h) => h.keterangan)
    .sort((a, b) => (b.waktu ?? '').localeCompare(a.waktu ?? ''));
  const ringkasan = isi.data.summary ?? {};
  return { status: 'ok', ringkasan: { status: statusKurir(teks(ringkasan.status, 60) || 'ON PROCESS'), keterangan: teks(ringkasan.desc) || null }, riwayat };
}
