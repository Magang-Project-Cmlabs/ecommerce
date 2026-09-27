import { describe, expect, it } from 'vitest';
import { RUTE_WAJIB_MASUK, butuhMasuk, keputusanProxy, urlMasuk } from './rute';

describe('butuhMasuk', () => {
  it.each(['/checkout', '/akun', '/akun/', '/akun/pesanan', '/akun/pesanan/INV-202609-0001', '/wishlist', '/admin', '/admin/produk'])(
    '%s wajib masuk',
    (p) => expect(butuhMasuk(p)).toBe(true),
  );

  it.each(['/', '/produk', '/produk/kaos-polos-premium', '/masuk', '/daftar', '/akunku', '/administrasi', '/checkout-promo', '/bantuan'])(
    '%s terbuka untuk tamu',
    (p) => expect(butuhMasuk(p)).toBe(false),
  );

  it('mencakup semua rute PRD §12', () => {
    expect([...RUTE_WAJIB_MASUK].sort()).toEqual(['/admin', '/akun', '/checkout', '/wishlist']);
  });
});

describe('urlMasuk', () => {
  it('menyertakan halaman asal (dengan query) sebagai next', () => {
    expect(urlMasuk('/akun/pesanan', '?status=dikirim')).toBe('/masuk?next=%2Fakun%2Fpesanan%3Fstatus%3Ddikirim');
    expect(urlMasuk('/checkout')).toBe('/masuk?next=%2Fcheckout');
  });
});

describe('keputusanProxy', () => {
  it('tamu di rute terlindungi dialihkan ke /masuk dengan next', () => {
    expect(keputusanProxy({ pathname: '/wishlist', search: '', adaSesiSah: false })).toBe('/masuk?next=%2Fwishlist');
  });

  it('pengguna dengan sesi sah diteruskan (role admin dicek ulang di server)', () => {
    expect(keputusanProxy({ pathname: '/admin', search: '', adaSesiSah: true })).toBeNull();
  });

  it('rute terbuka tidak pernah dialihkan', () => {
    expect(keputusanProxy({ pathname: '/produk', search: '?q=kaos', adaSesiSah: false })).toBeNull();
  });
});
