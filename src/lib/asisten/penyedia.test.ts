import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { konfigurasiAsisten, mintaJawaban } from './penyedia';

const jawab = (status: number, isi?: string) => new Response(JSON.stringify(isi ? { choices: [{ message: { content: isi } }] } : {}), { status });
const pesan = [{ role: 'user' as const, content: 'Halo' }];
const konf = { kunci: 'k', url: 'https://contoh.test/v1/chat/completions', models: ['a', 'b'] };

describe('penyedia asisten', () => {
  it('tanpa ASISTEN_API_KEY dianggap belum aktif', () => {
    expect(konfigurasiAsisten({})).toBeNull();
    expect(konfigurasiAsisten({ ASISTEN_API_KEY: '  ' })).toBeNull();
  });

  it('bawaan Gemini; URL dan model bisa diganti (Groq, OpenRouter)', () => {
    expect(konfigurasiAsisten({ ASISTEN_API_KEY: 'k' })).toEqual({ kunci: 'k', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', models: ['gemini-flash-lite-latest', 'gemini-flash-latest'] });
    expect(konfigurasiAsisten({ ASISTEN_API_KEY: 'k', ASISTEN_BASE_URL: 'https://api.groq.com/openai/v1/', ASISTEN_MODEL: 'x, y' })).toEqual({ kunci: 'k', url: 'https://api.groq.com/openai/v1/chat/completions', models: ['x', 'y'] });
  });

  it('tanpa konfigurasi tidak memanggil jaringan', async () => {
    const ambil = vi.fn();
    expect(await mintaJawaban(pesan, null, ambil)).toEqual({ ok: false, alasan: 'tidak-aktif' });
    expect(ambil).not.toHaveBeenCalled();
  });

  it('pindah ke model cadangan bila model pertama gagal', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ambil = vi.fn().mockResolvedValueOnce(jawab(503)).mockResolvedValueOnce(jawab(200, 'Siap membantu'));
    expect(await mintaJawaban(pesan, konf, ambil)).toEqual({ ok: true, jawaban: 'Siap membantu', model: 'b' });
    expect(JSON.parse(ambil.mock.calls[1]![1].body).model).toBe('b');
    expect(ambil.mock.calls[1]![1].headers.authorization).toBe('Bearer k');
  });

  it('kunci ditolak berhenti tanpa mencoba model lain; semua 429 dilaporkan sibuk', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const tolak = vi.fn().mockResolvedValue(jawab(401));
    expect(await mintaJawaban(pesan, konf, tolak)).toEqual({ ok: false, alasan: 'tidak-aktif' });
    expect(tolak).toHaveBeenCalledOnce();
    const ramai = vi.fn().mockResolvedValue(jawab(429));
    expect(await mintaJawaban(pesan, konf, ramai)).toEqual({ ok: false, alasan: 'sibuk' });
  });
});
