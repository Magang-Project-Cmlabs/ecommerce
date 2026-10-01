// Real MySQL, two independent pools: no mocked persistence or transaction.
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const request = vi.hoisted(() => ({ ip: '203.0.113.219' }));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers({ 'x-vercel-forwarded-for': request.ip })) }));
vi.mock('next/navigation', () => ({ redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/lib/auth/sesi', () => ({ simpanSesi: vi.fn(), hapusSesi: vi.fn() }));
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/generated/prisma/client';
import { konfigurasiDb } from '@/lib/konfigurasi-db';
import { prisma } from '@/lib/db';
import { catatBatasAuthDb, hapusBatasAuthDb, hashKunciBatasAuth } from '@/lib/data/batas-auth';
import { masuk, lupaPassword, resetPassword } from '@/actions/auth';
import { hashPassword } from '@/lib/auth/password';
import { simpanSesi } from '@/lib/auth/sesi';
import { after } from 'next/server';

const stamp = randomBytes(8).toString('hex');
const keys: string[] = [];
const key = (name: string) => { const value = `masuk:203.0.113.7:${stamp}:${name}`; keys.push(value); return value; };
let first: PrismaClient;
let second: PrismaClient;
const users: number[] = [];
beforeAll(() => {
  const name = new URL(process.env.DATABASE_URL!).pathname;
  if (!name.includes('verifikasi') && !name.endsWith('_test')) throw new Error('Rate limit integration requires isolated test database');
  vi.stubEnv('AUTH_SECRET', randomBytes(32).toString('hex'));
  first = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });
  second = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });
});
afterAll(async () => {
  await first.authRateLimit.deleteMany({ where: { keyHash: { in: keys.map(hashKunciBatasAuth) } } });
  await first.user.deleteMany({ where: { id: { in: users } } });
  await Promise.all([first.$disconnect(), second.$disconnect(), prisma.$disconnect()]);
  vi.unstubAllEnvs();
});

describe('MySQL pembatas auth bersama', () => {
  it('enam percobaan paralel dari dua pool mengizinkan tepat lima dan menyimpan HMAC tanpa IP', async () => {
    const kunci = key('concurrent');
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => catatBatasAuthDb(kunci, i % 2 ? first : second)));
    expect(results.filter(result => result.boleh)).toHaveLength(5);
    const row = await second.authRateLimit.findUniqueOrThrow({ where: { keyHash: hashKunciBatasAuth(kunci) } });
    expect(row.attempts).toBe(5); expect(row.keyHash).toMatch(/^[a-f0-9]{64}$/); expect(row.keyHash).not.toContain('203.0.113.7');
  });
  it('batas tetap bertahan lintas client dan penolakan tidak memperpanjang jendela', async () => {
    const kunci = key('shared'); const now = new Date();
    for (let i = 0; i < 5; i++) expect((await catatBatasAuthDb(kunci, first, now)).boleh).toBe(true);
    const row = await first.authRateLimit.findUniqueOrThrow({ where: { keyHash: hashKunciBatasAuth(kunci) } });
    expect(await catatBatasAuthDb(kunci, second, new Date(now.getTime() + 13 * 60000))).toEqual({ boleh: false, tungguDetik: 120 });
    expect((await second.authRateLimit.findUniqueOrThrow({ where: { keyHash: row.keyHash } })).expiresAt).toEqual(row.expiresAt);
  });
  it('jendela kedaluwarsa direset atomik; enam percobaan berikutnya hanya lima diterima', async () => {
    const kunci = key('expired'); const now = new Date();
    await first.authRateLimit.create({ data: { keyHash: hashKunciBatasAuth(kunci), attempts: 5, expiresAt: new Date(now.getTime() - 1) } });
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => catatBatasAuthDb(kunci, i % 2 ? first : second, now)));
    expect(results.filter(result => result.boleh)).toHaveLength(5);
    const row = await first.authRateLimit.findUniqueOrThrow({ where: { keyHash: hashKunciBatasAuth(kunci) } });
    expect(row.attempts).toBe(5); expect(row.expiresAt.getTime()).toBe(now.getTime() + 15 * 60000);
  });
  it('masuk berhasil menghapus hitungan bersama sehingga pool lain dapat mencoba kembali', async () => {
    const kunci = key('clear');
    for (let i = 0; i < 5; i++) await catatBatasAuthDb(kunci, first);
    expect((await catatBatasAuthDb(kunci, second)).boleh).toBe(false);
    await hapusBatasAuthDb(kunci, second);
    expect(await first.authRateLimit.count({ where: { keyHash: hashKunciBatasAuth(kunci) } })).toBe(0);
    expect((await catatBatasAuthDb(kunci, first)).boleh).toBe(true);
  });
  it('aksi berbeda untuk IP sama memiliki hitungan independen', async () => {
    const login = key('actions'); const reset = login.replace('masuk:', 'lupa-password:'); keys.push(reset);
    for (let i = 0; i < 5; i++) await catatBatasAuthDb(login, first);
    expect((await catatBatasAuthDb(login, second)).boleh).toBe(false);
    expect((await catatBatasAuthDb(reset, second)).boleh).toBe(true);
    expect(hashKunciBatasAuth(login)).not.toBe(hashKunciBatasAuth(reset));
  });
  it('action masuk dengan bcrypt/MySQL nyata membersihkan hitungan Vercel sesudah login berhasil', async () => {
    vi.stubEnv('VERCEL', '1'); request.ip = '203.0.113.219'; const loginKey = `masuk:${request.ip}`; keys.push(loginKey);
    const user = await first.user.create({ data: { name: 'Buyer Rate Limit', email: `rate-${stamp}@example.test`, passwordHash: await hashPassword('benar12345') } }); users.push(user.id);
    const form = new FormData(); form.set('email', user.email); form.set('password', 'salah12345');
    for (let i = 0; i < 4; i++) expect((await masuk(undefined, form))?.message).toBe('Email atau password salah');
    expect((await second.authRateLimit.findUniqueOrThrow({ where: { keyHash: hashKunciBatasAuth(loginKey) } })).attempts).toBe(4);
    form.set('password', 'benar12345'); await expect(masuk(undefined, form)).rejects.toThrow('redirect:/');
    expect(simpanSesi).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id, passwordVersion: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(await second.authRateLimit.count({ where: { keyHash: hashKunciBatasAuth(loginKey) } })).toBe(0);
    form.set('password', 'salah12345'); expect((await masuk(undefined, form))?.message).toBe('Email atau password salah');
    expect((await first.authRateLimit.findUniqueOrThrow({ where: { keyHash: hashKunciBatasAuth(loginKey) } })).attempts).toBe(1);
  });
  it('action lupa password memakai hitungan MySQL dan menolak permintaan keenam sebelum menjadwalkan email', async () => {
    vi.stubEnv('VERCEL', '1'); request.ip = '203.0.113.220'; keys.push(`lupa-password:${request.ip}`);
    vi.mocked(after).mockClear(); const form = new FormData(); form.set('email', `unknown-${stamp}@example.test`);
    for (let i = 0; i < 5; i++) expect((await lupaPassword(undefined, form))?.terkirim).toBe(true);
    expect((await lupaPassword(undefined, form))?.message).toMatch(/^Terlalu banyak percobaan/);
    expect(after).toHaveBeenCalledTimes(5);
    expect((await second.authRateLimit.findUniqueOrThrow({ where: { keyHash: hashKunciBatasAuth(`lupa-password:${request.ip}`) } })).attempts).toBe(5);
  });
  it('action reset membatasi token tidak dikenal melalui database bersama pada permintaan keenam', async () => {
    vi.stubEnv('VERCEL', '1'); request.ip = '203.0.113.221'; const resetKey = `reset-password:${request.ip}`; keys.push(resetKey);
    const form = new FormData(); form.set('token', randomBytes(32).toString('base64url')); form.set('password', 'reset12345'); form.set('confirmPassword', 'reset12345');
    for (let i = 0; i < 5; i++) expect((await resetPassword(undefined, form))?.message).toContain('Link reset tidak berlaku');
    expect((await resetPassword(undefined, form))?.message).toMatch(/^Terlalu banyak percobaan/);
    expect((await second.authRateLimit.findUniqueOrThrow({ where: { keyHash: hashKunciBatasAuth(resetKey) } })).attempts).toBe(5);
  });
});
