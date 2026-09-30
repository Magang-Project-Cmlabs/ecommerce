import { describe, expect, it } from 'vitest';
import { konfigurasiDb } from './konfigurasi-db';

const CA = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

describe('konfigurasiDb', () => {
  it('tanpa DATABASE_CA_CERT mengembalikan DATABASE_URL apa adanya (MySQL lokal)', () => {
    expect(konfigurasiDb({ DATABASE_URL: 'mysql://root:@localhost:3306/ecommerce' })).toBe(
      'mysql://root:@localhost:3306/ecommerce',
    );
  });

  it('tanpa DATABASE_URL gagal keras', () => {
    expect(() => konfigurasiDb({})).toThrow(/DATABASE_URL/);
  });

  it('dengan DATABASE_CA_CERT menyambung lewat TLS yang memverifikasi sertifikat server', () => {
    expect(
      konfigurasiDb({
        DATABASE_URL: 'mysql://avnadmin:rahasia@db.contoh.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED',
        DATABASE_CA_CERT: CA,
      }),
    ).toEqual({
      host: 'db.contoh.aivencloud.com',
      port: 12345,
      user: 'avnadmin',
      password: 'rahasia',
      database: 'defaultdb',
      ssl: { ca: CA, rejectUnauthorized: true },
      connectTimeout: 10_000,
    });
  });

  it('batas waktu sambung bisa diatur lewat URL (bawaan driver 1 detik terlalu pendek untuk TLS lintas benua)', () => {
    const hasil = konfigurasiDb({
      DATABASE_URL: 'mysql://u:p@h:1/d?connectTimeout=20000',
      DATABASE_CA_CERT: CA,
    });
    expect(hasil).toMatchObject({ connectTimeout: 20_000 });
  });

  it('password dengan karakter khusus di-decode, port bawaan 3306', () => {
    const hasil = konfigurasiDb({
      DATABASE_URL: 'mysql://toko:p%40ss%2Fw0rd@db.contoh.id/toko',
      DATABASE_CA_CERT: CA,
    });
    expect(hasil).toMatchObject({ password: 'p@ss/w0rd', port: 3306, database: 'toko' });
  });

  it('menerima sertifikat satu baris dengan \\n tertulis (bentuk yang umum di panel hosting)', () => {
    const hasil = konfigurasiDb({
      DATABASE_URL: 'mysql://u:p@h:1/d',
      DATABASE_CA_CERT: CA.replaceAll('\n', '\\n'),
    });
    expect(hasil).toMatchObject({ ssl: { ca: CA } });
  });

  it('meneruskan connectionLimit dari URL (membatasi koneksi per instance serverless)', () => {
    const hasil = konfigurasiDb({
      DATABASE_URL: 'mysql://u:p@h:1/d?connectionLimit=3',
      DATABASE_CA_CERT: CA,
    });
    expect(hasil).toMatchObject({ connectionLimit: 3 });
  });

  it('menolak DATABASE_CA_CERT yang bukan sertifikat PEM', () => {
    expect(() => konfigurasiDb({ DATABASE_URL: 'mysql://u:p@h:1/d', DATABASE_CA_CERT: 'bukan sertifikat' })).toThrow(
      /DATABASE_CA_CERT/,
    );
  });

  it('menolak DATABASE_URL yang bukan mysql:// saat TLS diminta, tanpa membocorkan password', () => {
    let pesan = '';
    try {
      konfigurasiDb({ DATABASE_URL: 'postgres://u:sangat-rahasia@h:1/d', DATABASE_CA_CERT: CA });
    } catch (galat) {
      pesan = (galat as Error).message;
    }
    expect(pesan).toMatch(/DATABASE_URL/);
    expect(pesan).not.toContain('sangat-rahasia');
  });
});
