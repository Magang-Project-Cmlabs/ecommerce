import { describe, expect, it } from 'vitest';
import { amanNext, daftarSchema, masukSchema } from './auth';

const daftarSah = {
  name: 'Budi Santoso',
  email: 'Budi@Contoh.ID ',
  phone: '',
  password: 'rahasia123',
  confirmPassword: 'rahasia123',
  agree: 'on',
};

describe('daftarSchema', () => {
  it('menerima data sah dan merapikan email serta telepon kosong', () => {
    const r = daftarSchema.safeParse(daftarSah);
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ name: 'Budi Santoso', email: 'budi@contoh.id', phone: null, password: 'rahasia123' });
  });

  it('menyimpan telepon yang diisi tanpa spasi', () => {
    const r = daftarSchema.safeParse({ ...daftarSah, phone: ' 0812 3456 7890 ' });
    expect(r.data?.phone).toBe('081234567890');
  });

  it.each([
    ['nama terlalu pendek', { name: 'B' }, 'name'],
    ['email tidak sah', { email: 'bukan-email' }, 'email'],
    ['telepon berisi huruf', { phone: '0812abc' }, 'phone'],
    ['password kurang dari 8 karakter', { password: 'abc1234', confirmPassword: 'abc1234' }, 'password'],
    ['password lebih dari 72 byte (batas bcrypt)', { password: 'é'.repeat(37), confirmPassword: 'é'.repeat(37) }, 'password'],
    ['konfirmasi tidak sama', { confirmPassword: 'rahasia124' }, 'confirmPassword'],
    ['belum menyetujui S&K dan Kebijakan Privasi', { agree: undefined }, 'agree'],
  ])('menolak %s', (_, ubah, field) => {
    const r = daftarSchema.safeParse({ ...daftarSah, ...ubah });
    expect(r.success).toBe(false);
    expect(Object.keys(r.error!.flatten().fieldErrors)).toContain(field);
  });

  it('konfirmasi yang tidak sama tetap dilaporkan walau kolom lain juga salah', () => {
    const r = daftarSchema.safeParse({ ...daftarSah, name: 'B', email: 'x', confirmPassword: 'beda12345', agree: undefined });
    expect(Object.keys(r.error!.flatten().fieldErrors).sort()).toEqual(['agree', 'confirmPassword', 'email', 'name']);
  });

  it('pesan galat berbahasa Indonesia', () => {
    const r = daftarSchema.safeParse({ ...daftarSah, password: 'abc', confirmPassword: 'abc' });
    expect(r.error!.flatten().fieldErrors.password?.[0]).toMatch(/minimal 8 karakter/);
  });
});

describe('masukSchema', () => {
  it('menerima email apa pun hurufnya dan password tidak kosong', () => {
    expect(masukSchema.safeParse({ email: ' DEMO@tokokita.id', password: 'x' }).data).toEqual({ email: 'demo@tokokita.id', password: 'x' });
  });

  it('menolak password kosong atau email tidak sah', () => {
    expect(masukSchema.safeParse({ email: 'demo@tokokita.id', password: '' }).success).toBe(false);
    expect(masukSchema.safeParse({ email: 'demo', password: 'x' }).success).toBe(false);
  });

  it('tidak mewajibkan panjang minimal saat masuk (akun lama tetap bisa masuk)', () => {
    expect(masukSchema.safeParse({ email: 'demo@tokokita.id', password: 'abc' }).success).toBe(true);
  });
});

describe('amanNext', () => {
  it.each([
    ['/akun', '/akun'],
    ['/checkout?langkah=2', '/checkout?langkah=2'],
    ['/produk/kaos-polos-premium#ulasan', '/produk/kaos-polos-premium#ulasan'],
  ])('mengizinkan path internal %s', (masuk, keluar) => {
    expect(amanNext(masuk)).toBe(keluar);
  });

  it.each([
    'https://jahat.example/phishing',
    '//jahat.example',
    '/\\jahat.example',
    'javascript:alert(1)',
    'akun',
    '/masuk',
    '/daftar?next=/akun',
    '',
    null,
    undefined,
  ])('menolak %j (open redirect / halaman auth) dan mengembalikan null', (masuk) => {
    expect(amanNext(masuk as string | null | undefined)).toBeNull();
  });
});
