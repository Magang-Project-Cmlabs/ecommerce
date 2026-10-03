import 'server-only';

// Klien model AI untuk asisten (D18) lewat fetch ke endpoint Chat Completions yang kompatibel
// OpenAI, tanpa SDK. Bawaan: Google Gemini API (kunci gratis dari Google AI Studio, tanpa kartu).
// Penyedia lain yang kompatibel (mis. Groq, OpenRouter) cukup mengganti ASISTEN_BASE_URL + ASISTEN_MODEL.

type Env = Record<string, string | undefined>;
const BASE_BAWAAN = 'https://generativelanguage.googleapis.com/v1beta/openai';
// Alias "latest" Gemini selalu menunjuk model Flash terbaru, jadi tidak usang saat versi berganti.
const MODEL_BAWAAN = ['gemini-flash-lite-latest', 'gemini-flash-latest'];

export type PesanChat = { role: 'system' | 'user' | 'assistant'; content: string };
export type HasilPenyedia = { ok: true; jawaban: string; model: string } | { ok: false; alasan: 'tidak-aktif' | 'sibuk' | 'gagal' };
export type KonfigurasiAsisten = { kunci: string; url: string; models: string[] };

export function konfigurasiAsisten(env: Env = process.env): KonfigurasiAsisten | null {
  const kunci = env.ASISTEN_API_KEY?.trim();
  if (!kunci) return null;
  const base = (env.ASISTEN_BASE_URL?.trim() || BASE_BAWAAN).replace(/\/+$/, '');
  const models = (env.ASISTEN_MODEL ?? '').split(',').map((m) => m.trim()).filter(Boolean);
  return { kunci, url: `${base}/chat/completions`, models: models.length ? models : MODEL_BAWAAN };
}

export async function mintaJawaban(pesan: PesanChat[], konfigurasi: KonfigurasiAsisten | null, ambil: typeof fetch = fetch): Promise<HasilPenyedia> {
  if (!konfigurasi) return { ok: false, alasan: 'tidak-aktif' };
  let sibuk = false;
  for (const model of konfigurasi.models.slice(0, 3)) {
    try {
      const res = await ambil(konfigurasi.url, {
        method: 'POST',
        headers: { authorization: `Bearer ${konfigurasi.kunci}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model, messages: pesan, max_tokens: 600, temperature: 0.3 }),
        signal: AbortSignal.timeout(20_000),
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) { console.error(`[asisten] kunci ditolak penyedia (HTTP ${res.status})`); return { ok: false, alasan: 'tidak-aktif' }; }
      if (!res.ok) { sibuk ||= res.status === 429; console.error(`[asisten] model ${model} gagal: HTTP ${res.status}`); continue; }
      const data = await res.json() as { choices?: { message?: { content?: string | null } }[] };
      const jawaban = data.choices?.[0]?.message?.content?.trim();
      if (jawaban) return { ok: true, jawaban, model };
      console.error(`[asisten] model ${model} tidak memberi jawaban`);
    } catch (e) {
      console.error(`[asisten] model ${model} tidak terjangkau: ${e instanceof Error ? e.name : 'galat'}`);
    }
  }
  return { ok: false, alasan: sibuk ? 'sibuk' : 'gagal' };
}
