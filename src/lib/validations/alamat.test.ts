import { describe, it, expect } from 'vitest';
import { alamatSchema } from './alamat';

describe('alamatSchema (KONTRAK_CHECKOUT §3)', () => {
  const dataValid = {
    label: 'Rumah',
    name: 'Budi Santoso',
    phone: '081234567890',
    street: 'Jl. Melati No. 10, RT 01/RW 02',
    district: 'Tebet',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postalCode: '12820',
    isDefault: true,
  };

  it('menerima data alamat yang valid dan lengkap', () => {
    const hasil = alamatSchema.safeParse(dataValid);
    expect(hasil.success).toBe(true);
    if (hasil.success) {
      expect(hasil.data).toEqual(dataValid);
    }
  });

  it('membersihkan spasi dan strip pada nomor telepon', () => {
    const hasil = alamatSchema.safeParse({
      ...dataValid,
      phone: '0812-3456-7890',
    });
    expect(hasil.success).toBe(true);
    if (hasil.success) {
      expect(hasil.data.phone).toBe('081234567890');
    }
  });

  it('menerima format nomor telepon dengan awalan +62 atau 62', () => {
    expect(alamatSchema.safeParse({ ...dataValid, phone: '+6281234567890' }).success).toBe(true);
    expect(alamatSchema.safeParse({ ...dataValid, phone: '6281234567890' }).success).toBe(true);
  });

  it('menolak nomor telepon tidak sah', () => {
    expect(alamatSchema.safeParse({ ...dataValid, phone: '12345' }).success).toBe(false);
    expect(alamatSchema.safeParse({ ...dataValid, phone: '0211234567' }).success).toBe(false);
  });

  it('menolak kode pos yang bukan 5 digit angka', () => {
    expect(alamatSchema.safeParse({ ...dataValid, postalCode: '1234' }).success).toBe(false);
    expect(alamatSchema.safeParse({ ...dataValid, postalCode: '123456' }).success).toBe(false);
    expect(alamatSchema.safeParse({ ...dataValid, postalCode: '1234A' }).success).toBe(false);
  });

  it('menolak label kosong atau melebihi 50 karakter', () => {
    expect(alamatSchema.safeParse({ ...dataValid, label: '   ' }).success).toBe(false);
    expect(alamatSchema.safeParse({ ...dataValid, label: 'A'.repeat(51) }).success).toBe(false);
  });

  it('menolak nama penerima kurang dari 2 atau lebih dari 100 karakter', () => {
    expect(alamatSchema.safeParse({ ...dataValid, name: 'A' }).success).toBe(false);
    expect(alamatSchema.safeParse({ ...dataValid, name: 'A'.repeat(101) }).success).toBe(false);
  });

  it('menolak alamat jalan kurang dari 5 karakter', () => {
    expect(alamatSchema.safeParse({ ...dataValid, street: 'Jl.' }).success).toBe(false);
  });

  it('mengisi isDefault default false jika tidak diberikan', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isDefault, ...tanpaDefault } = dataValid;
    const hasil = alamatSchema.safeParse(tanpaDefault);
    expect(hasil.success).toBe(true);
    if (hasil.success) {
      expect(hasil.data.isDefault).toBe(false);
    }
  });
});
