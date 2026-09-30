import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { alamatSchema } from './alamat';


const alamatSah = {
  label: '  Rumah  ',
  name: '  Budi Santoso  ',
  phone: ' 0812-3456 7890 ',
  street: '  Jl. Melati No. 10  ',
  district: '  Kebayoran Baru  ',
  city: '  Jakarta Selatan  ',
  province: '  DKI Jakarta  ',
  postalCode: '12345',
};

describe('alamatSchema', () => {
  it('mewajibkan field alamat dan menormalkan teks serta nomor telepon', () => {
    expect(alamatSchema.parse(alamatSah)).toEqual({
      label: 'Rumah',
      name: 'Budi Santoso',
      phone: '081234567890',
      street: 'Jl. Melati No. 10',
      district: 'Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12345',
      isDefault: false,
    });
  });

  it('menerima flag isDefault boolean yang dikirim dan menolak tipe selain boolean', () => {
    expect(alamatSchema.parse({ ...alamatSah, isDefault: true }).isDefault).toBe(true);
    const result = alamatSchema.safeParse({ ...alamatSah, isDefault: 'true' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(z.flattenError(result.error).fieldErrors).toHaveProperty('isDefault');
  });

  it.each([
    ['label kosong setelah trim', { label: '   ' }, 'label'],
    ['label lebih dari 50 karakter', { label: 'a'.repeat(51) }, 'label'],
    ['nama penerima terlalu pendek', { name: 'B' }, 'name'],
    ['nama penerima lebih dari 100 karakter', { name: 'a'.repeat(101) }, 'name'],
    ['telepon kosong', { phone: ' - ' }, 'phone'],
    ['telepon dengan format tidak sah', { phone: '0812abc' }, 'phone'],
    ['jalan terlalu pendek', { street: 'Jln' }, 'street'],
    ['jalan lebih dari 255 karakter', { street: 'a'.repeat(256) }, 'street'],
    ['kecamatan kosong', { district: ' ' }, 'district'],
    ['kecamatan lebih dari 100 karakter', { district: 'a'.repeat(101) }, 'district'],
    ['kota kosong', { city: ' ' }, 'city'],
    ['kota lebih dari 100 karakter', { city: 'a'.repeat(101) }, 'city'],
    ['provinsi kosong', { province: ' ' }, 'province'],
    ['provinsi lebih dari 100 karakter', { province: 'a'.repeat(101) }, 'province'],
    ['kode pos bukan lima angka', { postalCode: '1234A' }, 'postalCode'],
    ['kode pos tidak menerima spasi ekstra', { postalCode: ' 12345 ' }, 'postalCode'],
  ])('mengembalikan error untuk %s di field yang tepat', (_, ubah, field) => {
    const result = alamatSchema.safeParse({ ...alamatSah, ...ubah });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(z.flattenError(result.error).fieldErrors).toHaveProperty(field);
  });

  it('menerima variasi nomor telepon Indonesia yang ditentukan kontrak', () => {
    for (const phone of ['081234567890', '6281234567890', '+6281234567890']) {
      expect(alamatSchema.parse({ ...alamatSah, phone }).phone).toBe(phone);
    }
  });

  it('melaporkan error setiap field yang tidak valid secara terpisah', () => {
    const result = alamatSchema.safeParse({
      ...alamatSah,
      label: '',
      name: 'B',
      phone: 'telepon',
      street: 'Jln',
      district: '',
      city: '',
      province: '',
      postalCode: '123',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(z.flattenError(result.error).fieldErrors).sort()).toEqual([
      'city',
      'district',
      'label',
      'name',
      'phone',
      'postalCode',
      'province',
      'street',
    ]);
  });
});