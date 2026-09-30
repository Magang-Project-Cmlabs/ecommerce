import { describe, it, expect } from 'vitest';
import { ubahProfilSchema, gantiPasswordSchema, hapusAkunSchema } from './akun';

describe('ubahProfilSchema (PRD §5.1, §6.2)', () => {
  it('menerima input nama dan telepon valid', () => {
    const res = ubahProfilSchema.safeParse({
      name: 'Rizki Kusnadi',
      phone: '081234567890',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe('Rizki Kusnadi');
      expect(res.data.phone).toBe('081234567890');
    }
  });

  it('menerima format telepon +62 dan membersihkan strip/spasi', () => {
    const res = ubahProfilSchema.safeParse({
      name: 'Rizki Kusnadi',
      phone: '+62 812-3456-7890',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.phone).toBe('+6281234567890');
    }
  });

  it('mengizinkan nomor telepon kosong atau null', () => {
    const resEmpty = ubahProfilSchema.safeParse({
      name: 'Rizki Kusnadi',
      phone: '',
    });
    expect(resEmpty.success).toBe(true);
    if (resEmpty.success) {
      expect(resEmpty.data.phone).toBe(null);
    }

    const resNull = ubahProfilSchema.safeParse({
      name: 'Rizki Kusnadi',
      phone: null,
    });
    expect(resNull.success).toBe(true);
    if (resNull.success) {
      expect(resNull.data.phone).toBe(null);
    }
  });

  it('menolak nama kurang dari 2 atau lebih dari 100 karakter', () => {
    expect(ubahProfilSchema.safeParse({ name: 'A' }).success).toBe(false);
    expect(ubahProfilSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(ubahProfilSchema.safeParse({ name: 'A'.repeat(101) }).success).toBe(false);
  });

  it('menolak format nomor telepon yang tidak valid', () => {
    expect(ubahProfilSchema.safeParse({ name: 'Rizki', phone: '12345' }).success).toBe(false);
    expect(ubahProfilSchema.safeParse({ name: 'Rizki', phone: '0211234567' }).success).toBe(false);
  });
});

describe('gantiPasswordSchema (PRD §5.2, §6.2)', () => {
  it('menerima perubahan password yang valid', () => {
    const res = gantiPasswordSchema.safeParse({
      currentPassword: 'PasswordLama123',
      newPassword: 'PasswordBaru456',
      confirmPassword: 'PasswordBaru456',
    });
    expect(res.success).toBe(true);
  });

  it('menolak jika password saat ini kosong', () => {
    const res = gantiPasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'PasswordBaru456',
      confirmPassword: 'PasswordBaru456',
    });
    expect(res.success).toBe(false);
  });

  it('menolak password baru kurang dari 8 karakter', () => {
    const res = gantiPasswordSchema.safeParse({
      currentPassword: 'PasswordLama123',
      newPassword: 'Pass1',
      confirmPassword: 'Pass1',
    });
    expect(res.success).toBe(false);
  });

  it('menolak password baru tanpa angka atau tanpa huruf', () => {
    // Hanya huruf
    const hanyaHuruf = gantiPasswordSchema.safeParse({
      currentPassword: 'PasswordLama123',
      newPassword: 'PasswordBaruAja',
      confirmPassword: 'PasswordBaruAja',
    });
    expect(hanyaHuruf.success).toBe(false);

    // Hanya angka
    const hanyaAngka = gantiPasswordSchema.safeParse({
      currentPassword: 'PasswordLama123',
      newPassword: '1234567890',
      confirmPassword: '1234567890',
    });
    expect(hanyaAngka.success).toBe(false);
  });

  it('menolak jika konfirmasi password tidak cocok', () => {
    const res = gantiPasswordSchema.safeParse({
      currentPassword: 'PasswordLama123',
      newPassword: 'PasswordBaru456',
      confirmPassword: 'PasswordBeda789',
    });
    expect(res.success).toBe(false);
  });

  it('menolak jika password baru sama dengan password saat ini', () => {
    const res = gantiPasswordSchema.safeParse({
      currentPassword: 'PasswordSama123',
      newPassword: 'PasswordSama123',
      confirmPassword: 'PasswordSama123',
    });
    expect(res.success).toBe(false);
  });
});

describe('hapusAkunSchema (PRD §5.4, §6.2)', () => {
  it('menerima konfirmasi penghapusan akun yang valid', () => {
    const res = hapusAkunSchema.safeParse({
      password: 'PasswordRahasia123',
      konfirmasi: true,
    });
    expect(res.success).toBe(true);
  });

  it('menolak jika password kosong', () => {
    const res = hapusAkunSchema.safeParse({
      password: '',
      konfirmasi: true,
    });
    expect(res.success).toBe(false);
  });

  it('menolak jika checkbox persetujuan belum dicentang', () => {
    const res = hapusAkunSchema.safeParse({
      password: 'PasswordRahasia123',
      konfirmasi: false,
    });
    expect(res.success).toBe(false);
  });
});
