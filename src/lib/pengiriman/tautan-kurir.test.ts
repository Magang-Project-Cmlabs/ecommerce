import { describe, expect, it } from 'vitest';
import { halamanLacakKurir } from './tautan-kurir';

describe('halaman lacak resmi kurir (gratis)', () => {
  it('JNE dan SiCepat mengarah ke situs resmi HTTPS', () => {
    expect(halamanLacakKurir('jne_reg')).toEqual({ label: 'JNE', url: 'https://www.jne.co.id/tracking-package' });
    expect(halamanLacakKurir('sicepat_reg')).toEqual({ label: 'SiCepat', url: 'https://www.sicepat.com/' });
  });
  it('GoSend dan kode lain tidak punya tautan', () => {
    expect(halamanLacakKurir('gosend_instant')).toBeNull();
    expect(halamanLacakKurir('tidak-ada')).toBeNull();
  });
});
