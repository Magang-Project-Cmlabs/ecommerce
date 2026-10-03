import 'server-only';

// Klien model AI untuk asisten (D18) lewat fetch ke endpoint Chat Completions yang kompatibel
// OpenAI, tanpa SDK. Penyedia utama bawaan Google Gemini (ASISTEN_*), cadangan bawaan Groq
// (ASISTEN_CADANGAN_*); keduanya punya kunci gratis tanpa kartu. Penyedia lain yang kompatibel
// (mis. OpenRouter) cukup mengganti *_BASE_URL + *_MODEL.

type Env = Record<string, string | undefined>;
export type PesanChat = { role: 'system' | 'user' | 'assistant'; content: string };
export type HasilPenyedia = { ok: true; jawaban: string; model: string; penyedia: string } | { ok: false; alasan: 'tidak-aktif' | 'sibuk' | 'gagal' };
export type Penyedia = { nama: string; kunci: string; url: string; models: string[] };

const BAWAAN = {
  utama: { nama: 'utama', awalan: 'ASISTEN_', base: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-flash-lite-latest', 'gemini-flash-latest'] },
  // Alias "latest" Gemini selalu menunjuk Flash terbaru; model Groq bisa diganti lewat ASISTEN_CADANGAN_MODEL.
  cadangan: { nama: 'cadangan', awalan: 'ASISTEN_CADANGAN_', base: 'https://api.groq.com/openai/v1', models: ['llama-3.3-70b-versatile'] },
} as const;

const BATAS_PERCOBAAN = 4;          // total panggilan per pertanyaan (semua penyedia)
const BATAS_WAKTU_PER_PANGGILAN = 15_000;
const BATAS_WAKTU_TOTAL = 30_000;   // setelah ini tidak memulai panggilan baru

function satuPenyedia(env: Env, b: (typeof BAWAAN)[keyof typeof BAWAAN]): Penyedia | null {
  const kunci = env[`${b.awalan}API_KEY`]?.trim();
  if (!kunci) return null;
  const base = (env[`${b.awalan}BASE_URL`]?.trim() || b.base).replace(/\/+$/, '');
  const models = (env[`${b.awalan}MODEL`] ?? '').split(',').map((m) => m.trim()).filter(Boolean);
  return { nama: b.nama, kunci, url: `${base}/chat/completions`, models: models.length ? models : [...b.models] };
}

/** Daftar penyedia yang terpasang, urut utama lalu cadangan. Kosong = asisten belum aktif. */
export function daftarPenyedia(env: Env = process.env): Penyedia[] {
  return [satuPenyedia(env, BAWAAN.utama), satuPenyedia(env, BAWAAN.cadangan)].filter((p): p is Penyedia => p !== null);
}

export async function mintaJawaban(pesan: PesanChat[], penyedia: Penyedia[], ambil: typeof fetch = fetch, jam: () => number = Date.now): Promise<HasilPenyedia> {
  const mulai = jam();
  let sibuk = false, adaKunciDiterima = false, percobaan = 0;
  for (const p of penyedia) {
    for (const model of p.models.slice(0, 2)) {
      if (percobaan >= BATAS_PERCOBAAN || jam() - mulai > BATAS_WAKTU_TOTAL) break;
      percobaan++;
      try {
        const res = await ambil(p.url, {
          method: 'POST',
          headers: { authorization: `Bearer ${p.kunci}`, 'content-type': 'application/json' },
          body: JSON.stringify({ model, messages: pesan, max_tokens: 1000, temperature: 0.3 }),
          signal: AbortSignal.timeout(BATAS_WAKTU_PER_PANGGILAN),
          cache: 'no-store',
        });
        // Kunci ditolak: model lain di penyedia yang sama pasti juga ditolak, langsung ke penyedia berikutnya.
        if (res.status === 401 || res.status === 403) { console.error(`[asisten] kunci penyedia ${p.nama} ditolak (HTTP ${res.status})`); break; }
        adaKunciDiterima = true;
        if (!res.ok) { sibuk ||= res.status === 429; console.error(`[asisten] ${p.nama}/${model} gagal: HTTP ${res.status}`); continue; }
        const data = await res.json() as { choices?: { message?: { content?: string | null } }[] };
        const jawaban = data.choices?.[0]?.message?.content?.trim();
        if (jawaban) return { ok: true, jawaban, model, penyedia: p.nama };
        console.error(`[asisten] ${p.nama}/${model} tidak memberi jawaban`);
      } catch (e) {
        adaKunciDiterima = true;
        console.error(`[asisten] ${p.nama}/${model} tidak terjangkau: ${e instanceof Error ? e.name : 'galat'}`);
      }
    }
  }
  if (!penyedia.length || !adaKunciDiterima) return { ok: false, alasan: 'tidak-aktif' };
  return { ok: false, alasan: sibuk ? 'sibuk' : 'gagal' };
}
