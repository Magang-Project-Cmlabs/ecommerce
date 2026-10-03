import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/batas-auth', () => ({ catatBatasAuthDb: vi.fn() }));
import { BATAS_ASISTEN, catatBatasAsisten } from './pembatas';

describe('catatBatasAsisten (driver memori)', () => {
  it('menolak setelah batas singkat per identitas, identitas lain tetap boleh', async () => {
    for (let i = 0; i < BATAS_ASISTEN.singkat.maks; i++) expect((await catatBatasAsisten('ip:198.51.100.1')).boleh).toBe(true);
    const ditolak = await catatBatasAsisten('ip:198.51.100.1');
    expect(ditolak).toMatchObject({ boleh: false, lingkup: 'singkat' });
    expect((await catatBatasAsisten('u:42')).boleh).toBe(true);
  });

  it('batas angkanya masuk akal: singkat < harian < global', () => {
    expect(BATAS_ASISTEN.singkat.maks).toBeLessThan(BATAS_ASISTEN.harian.maks);
    expect(BATAS_ASISTEN.harian.maks).toBeLessThan(BATAS_ASISTEN.global.maks);
  });
});
