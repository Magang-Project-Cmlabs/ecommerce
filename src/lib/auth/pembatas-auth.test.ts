import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/batas-auth', () => ({ catatBatasAuthDb: vi.fn(async () => ({ boleh: true })), hapusBatasAuthDb: vi.fn(async () => {}) }));
import { catatBatasAuthDb, hapusBatasAuthDb } from '@/lib/data/batas-auth';
import { catatBatasAuth, hapusBatasAuth } from './pembatas-auth';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('driver pembatas auth', () => {
  it('development memakai Map dan hapus mengosongkan hitungan tanpa query DB', async () => {
    vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('VERCEL', '0');
    for (let i = 0; i < 5; i++) expect((await catatBatasAuth('test-local')).boleh).toBe(true);
    expect((await catatBatasAuth('test-local')).boleh).toBe(false);
    await hapusBatasAuth('test-local'); expect((await catatBatasAuth('test-local')).boleh).toBe(true); await hapusBatasAuth('test-local');
    expect(catatBatasAuthDb).not.toHaveBeenCalled(); expect(hapusBatasAuthDb).not.toHaveBeenCalled();
  });
  it.each([{ NODE_ENV: 'production', VERCEL: '0' }, { NODE_ENV: 'test', VERCEL: '1' }])('memakai database di $NODE_ENV/Vercel=$VERCEL', async env => {
    vi.stubEnv('NODE_ENV', env.NODE_ENV); vi.stubEnv('VERCEL', env.VERCEL);
    expect(await catatBatasAuth('shared')).toEqual({ boleh: true }); await hapusBatasAuth('shared');
    expect(catatBatasAuthDb).toHaveBeenCalledWith('shared'); expect(hapusBatasAuthDb).toHaveBeenCalledWith('shared');
  });
});
