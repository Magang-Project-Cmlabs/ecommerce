import { describe, expect, it } from 'vitest';
import { ipKlien } from './ip';

const h = (isi: Record<string, string>) => new Headers(isi);

describe('ipKlien', () => {
  it('di Vercel hanya mempercayai header IP yang ditulis platform', () => {
    expect(ipKlien(h({ 'x-vercel-forwarded-for': '203.0.113.7', 'x-real-ip': '6.6.6.6', 'x-forwarded-for': '7.7.7.7' }), { VERCEL: '1' })).toBe('203.0.113.7');
    expect(ipKlien(h({ 'x-real-ip': '6.6.6.6', 'x-forwarded-for': '7.7.7.7' }), { VERCEL: '1' })).toBeNull();
    expect(ipKlien(h({ 'x-vercel-forwarded-for': '203.0.113.7, 6.6.6.6' }), { VERCEL: '1' })).toBeNull();
    expect(ipKlien(h({ 'x-vercel-forwarded-for': 'invalid' }), { VERCEL: '1' })).toBeNull();
  });
  it('memakai X-Real-IP yang ditulis Nginx', () => {
    expect(ipKlien(h({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1, 203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('tanpa X-Real-IP memakai entri TERAKHIR X-Forwarded-For (yang ditambahkan proxy terdekat, bukan isian klien)', () => {
    expect(ipKlien(h({ 'x-forwarded-for': '6.6.6.6, 198.51.100.2' }))).toBe('198.51.100.2');
    expect(ipKlien(h({ 'x-forwarded-for': '::1' }))).toBe('::1');
  });

  it('tanpa header apa pun mengembalikan null — BUKAN kunci bersama yang bisa mengunci semua pengunjung', () => {
    expect(ipKlien(h({}))).toBeNull();
    expect(ipKlien(h({ 'x-real-ip': '  ', 'x-forwarded-for': ' , ' }))).toBeNull();
  });

  it('nilai aneh dipotong agar tidak membengkakkan kunci di memori', () => {
    expect(ipKlien(h({ 'x-real-ip': 'x'.repeat(500) }))!.length).toBeLessThanOrEqual(64);
  });
});
