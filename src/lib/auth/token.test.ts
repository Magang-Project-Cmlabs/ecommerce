import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { MASA_SESI_DETIK, bacaTokenSesi, buatTokenSesi, kunciDariRahasia } from './token';

const RAHASIA = 'kunci-uji-yang-panjangnya-lebih-dari-32-karakter';
const kunci = kunciDariRahasia(RAHASIA);

describe('kunciDariRahasia', () => {
  it('menolak rahasia kosong atau kurang dari 32 karakter', () => {
    expect(() => kunciDariRahasia(undefined)).toThrow(/AUTH_SECRET/);
    expect(() => kunciDariRahasia('pendek')).toThrow(/32 karakter/);
  });

  it('menolak placeholder .env.example di production', () => {
    expect(() => kunciDariRahasia('ganti-dengan-string-acak-minimal-32-karakter', 'production')).toThrow(/placeholder/);
    expect(() => kunciDariRahasia('ganti-dengan-string-acak-minimal-32-karakter', 'development')).not.toThrow();
  });
});

describe('token sesi', () => {
  it('berlaku 30 hari (PRD §13)', () => {
    expect(MASA_SESI_DETIK).toBe(30 * 24 * 60 * 60);
  });

  it('bisa dibaca kembali dan hanya berisi id + role', async () => {
    const token = await buatTokenSesi({ userId: 42, role: 'customer' }, kunci);
    expect(await bacaTokenSesi(token, kunci)).toEqual({ userId: 42, role: 'customer' });
    const isi = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
    expect(Object.keys(isi).sort()).toEqual(['exp', 'iat', 'role', 'sub']);
  });

  it('token kosong atau rusak dianggap tidak ada sesi', async () => {
    expect(await bacaTokenSesi(undefined, kunci)).toBeNull();
    expect(await bacaTokenSesi('', kunci)).toBeNull();
    expect(await bacaTokenSesi('bukan.token.jwt', kunci)).toBeNull();
  });

  it('token yang diubah isinya ditolak', async () => {
    const token = await buatTokenSesi({ userId: 42, role: 'customer' }, kunci);
    const [h, , s] = token.split('.');
    const isiPalsu = Buffer.from(JSON.stringify({ sub: '1', role: 'admin', iat: 1, exp: 9999999999 })).toString('base64url');
    expect(await bacaTokenSesi(`${h}.${isiPalsu}.${s}`, kunci)).toBeNull();
  });

  it('token dari kunci lain ditolak', async () => {
    const token = await buatTokenSesi({ userId: 42, role: 'admin' }, kunciDariRahasia('kunci-lain-yang-juga-panjangnya-lebih-dari-32'));
    expect(await bacaTokenSesi(token, kunci)).toBeNull();
  });

  it('token kedaluwarsa ditolak', async () => {
    const lama = Math.floor(Date.now() / 1000) - 2 * MASA_SESI_DETIK;
    const token = await buatTokenSesi({ userId: 42, role: 'customer' }, kunci, lama);
    expect(await bacaTokenSesi(token, kunci)).toBeNull();
  });

  it('algoritma "none" dan role tak dikenal ditolak', async () => {
    const tanpaTanda = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"sub":"1","role":"admin"}').toString('base64url')}.`;
    expect(await bacaTokenSesi(tanpaTanda, kunci)).toBeNull();

    const roleAneh = await new SignJWT({ role: 'superadmin' }).setProtectedHeader({ alg: 'HS256' }).setSubject('1').setIssuedAt().setExpirationTime('1h').sign(kunci);
    expect(await bacaTokenSesi(roleAneh, kunci)).toBeNull();

    const subBukanAngka = await new SignJWT({ role: 'customer' }).setProtectedHeader({ alg: 'HS256' }).setSubject('abc').setIssuedAt().setExpirationTime('1h').sign(kunci);
    expect(await bacaTokenSesi(subBukanAngka, kunci)).toBeNull();
  });
});
