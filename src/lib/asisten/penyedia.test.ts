import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { daftarPenyedia, mintaJawaban, type Penyedia } from './penyedia';

const jawab = (status: number, isi?: string) => new Response(JSON.stringify(isi ? { choices: [{ message: { content: isi } }] } : {}), { status });
const pesan = [{ role: 'user' as const, content: 'Halo' }];
const utama: Penyedia = { nama: 'utama', kunci: 'g', url: 'https://gemini.test/chat/completions', models: ['a', 'b'] };
const cadangan: Penyedia = { nama: 'cadangan', kunci: 'q', url: 'https://groq.test/chat/completions', models: ['c'] };
const diam = () => vi.spyOn(console, 'error').mockImplementation(() => {});

describe('daftarPenyedia', () => {
  it('kosong bila tidak ada kunci', () => {
    expect(daftarPenyedia({})).toEqual([]);
    expect(daftarPenyedia({ ASISTEN_API_KEY: '  ' })).toEqual([]);
  });

  it('utama Gemini lalu cadangan Groq, masing-masing dengan bawaan', () => {
    expect(daftarPenyedia({ ASISTEN_API_KEY: 'g', ASISTEN_CADANGAN_API_KEY: 'q' })).toEqual([
      { nama: 'utama', kunci: 'g', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', models: ['gemini-flash-lite-latest', 'gemini-flash-latest'] },
      { nama: 'cadangan', kunci: 'q', url: 'https://api.groq.com/openai/v1/chat/completions', models: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'] },
    ]);
  });

  it('cadangan saja tetap mengaktifkan asisten; URL dan model bisa diganti (mis. OpenRouter)', () => {
    expect(daftarPenyedia({ ASISTEN_CADANGAN_API_KEY: 'q', ASISTEN_CADANGAN_BASE_URL: 'https://openrouter.ai/api/v1/', ASISTEN_CADANGAN_MODEL: 'x:free, y' })).toEqual([
      { nama: 'cadangan', kunci: 'q', url: 'https://openrouter.ai/api/v1/chat/completions', models: ['x:free', 'y'] },
    ]);
  });
});

describe('mintaJawaban', () => {
  it('tanpa penyedia tidak memanggil jaringan', async () => {
    const ambil = vi.fn();
    expect(await mintaJawaban(pesan, [], ambil)).toEqual({ ok: false, alasan: 'tidak-aktif' });
    expect(ambil).not.toHaveBeenCalled();
  });

  it('pindah ke model kedua bila model pertama gagal', async () => {
    diam();
    const ambil = vi.fn().mockResolvedValueOnce(jawab(503)).mockResolvedValueOnce(jawab(200, 'Siap'));
    expect(await mintaJawaban(pesan, [utama, cadangan], ambil)).toEqual({ ok: true, jawaban: 'Siap', model: 'b', penyedia: 'utama' });
    expect(ambil.mock.calls[1]![1].headers.authorization).toBe('Bearer g');
  });

  it('permintaan ke model hanya berisi teks: tanpa tools/functions dan jawaban dibatasi', async () => {
    const ambil = vi.fn().mockResolvedValue(jawab(200, 'ok'));
    await mintaJawaban(pesan, [utama], ambil);
    const badan = JSON.parse(ambil.mock.calls[0]![1].body);
    expect(Object.keys(badan).sort()).toEqual(['max_tokens', 'messages', 'model', 'temperature']);
    expect(badan.max_tokens).toBeLessThanOrEqual(800);
  });

  it('kuota utama habis (429 di semua model) → cadangan menjawab dengan kuncinya sendiri', async () => {
    diam();
    const ambil = vi.fn().mockResolvedValueOnce(jawab(429)).mockResolvedValueOnce(jawab(429)).mockResolvedValueOnce(jawab(200, 'Dari Groq'));
    expect(await mintaJawaban(pesan, [utama, cadangan], ambil)).toEqual({ ok: true, jawaban: 'Dari Groq', model: 'c', penyedia: 'cadangan' });
    expect(ambil.mock.calls[2]![0]).toBe('https://groq.test/chat/completions');
    expect(ambil.mock.calls[2]![1].headers.authorization).toBe('Bearer q');
  });

  it('kunci utama ditolak → tidak mencoba model utama lain, langsung cadangan', async () => {
    diam();
    const ambil = vi.fn().mockResolvedValueOnce(jawab(401)).mockResolvedValueOnce(jawab(200, 'Dari Groq'));
    expect(await mintaJawaban(pesan, [utama, cadangan], ambil)).toMatchObject({ ok: true, penyedia: 'cadangan' });
    expect(ambil).toHaveBeenCalledTimes(2);
  });

  it('semua kunci ditolak = tidak aktif; semua 429 = sibuk', async () => {
    diam();
    expect(await mintaJawaban(pesan, [utama, cadangan], vi.fn().mockResolvedValue(jawab(403)))).toEqual({ ok: false, alasan: 'tidak-aktif' });
    expect(await mintaJawaban(pesan, [utama, cadangan], vi.fn().mockResolvedValue(jawab(429)))).toEqual({ ok: false, alasan: 'sibuk' });
  });

  it('berhenti memulai panggilan baru setelah batas waktu total', async () => {
    diam();
    let t = 0;
    const ambil = vi.fn(async () => { t += 20_000; return jawab(500); });
    expect(await mintaJawaban(pesan, [utama, cadangan], ambil, () => t)).toEqual({ ok: false, alasan: 'gagal' });
    expect(ambil).toHaveBeenCalledTimes(2);
  });
});
