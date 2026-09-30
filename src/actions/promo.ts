'use server';

// Validasi kode promo (PRD §10.4, KONTRAK_CHECKOUT.md §4).
// Mendukung kode promo aktif di database dan kode demo standar (HEMAT10, ONGKIRFREE, BELANJA50).

export type HasilValidasiPromo =
  | {
      ok: true;
      code: string;
      description: string;
      discount: number;
      type: 'PERCENT' | 'FIXED';
      value: number;
      minSubtotal: number;
      maxDiscount: number | null;
    }
  | {
      ok: false;
      message: string;
    };

const PROMO_DEMO: Record<
  string,
  {
    description: string;
    type: 'PERCENT' | 'FIXED';
    value: number;
    minSubtotal: number;
    maxDiscount: number | null;
  }
> = {
  HEMAT10: {
    description: 'Hemat 10% hingga Rp 50.000',
    type: 'PERCENT',
    value: 10,
    minSubtotal: 100_000,
    maxDiscount: 50_000,
  },
  ONGKIRFREE: {
    description: 'Potongan Rp 20.000 untuk belanja min. Rp 150.000',
    type: 'FIXED',
    value: 20_000,
    minSubtotal: 150_000,
    maxDiscount: null,
  },
  BELANJA50: {
    description: 'Potongan Rp 50.000 untuk belanja min. Rp 500.000',
    type: 'FIXED',
    value: 50_000,
    minSubtotal: 500_000,
    maxDiscount: null,
  },
};

export async function cekKodePromo(
  kodeMentah: string,
  subtotal: number
): Promise<HasilValidasiPromo> {
  const code = (kodeMentah ?? '').trim().toUpperCase();

  if (!code) {
    return { ok: false, message: 'Masukkan kode promo terlebih dahulu.' };
  }

  if (subtotal <= 0) {
    return { ok: false, message: 'Keranjang belanja masih kosong.' };
  }

  // 1. Cek promo demo standar terlebih dahulu (PRD §10.4: HEMAT10, ONGKIRFREE, BELANJA50)
  // Memberikan respons instan tanpa terhambat latency koneksi database
  const demo = PROMO_DEMO[code];
  if (demo) {
    if (subtotal < demo.minSubtotal) {
      return {
        ok: false,
        message: `Minimal belanja Rp ${demo.minSubtotal.toLocaleString('id-ID')} untuk menggunakan kode ini.`,
      };
    }

    let diskon =
      demo.type === 'PERCENT'
        ? Math.floor((subtotal * demo.value) / 100)
        : demo.value;

    if (demo.maxDiscount !== null) {
      diskon = Math.min(diskon, demo.maxDiscount);
    }
    diskon = Math.min(diskon, subtotal);

    return {
      ok: true,
      code,
      description: demo.description,
      discount: diskon,
      type: demo.type,
      value: demo.value,
      minSubtotal: demo.minSubtotal,
      maxDiscount: demo.maxDiscount,
    };
  }

  // 2. Coba periksa ke database via Prisma bila server database aktif (dengan timeout 2.5s)
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );

    const dbQuery = async () => {
      const { prisma } = await import('@/lib/db');
      return prisma.promoCode.findUnique({
        where: { code, isActive: true },
      });
    };

    const promo = await Promise.race([dbQuery(), timeoutPromise]);

    if (promo) {
      const sekarang = new Date();
      if (sekarang < promo.startsAt || sekarang > promo.expiresAt) {
        return { ok: false, message: 'Kode promo sudah kedaluwarsa atau belum berlaku.' };
      }
      if (promo.quota !== null && promo.usedCount >= promo.quota) {
        return { ok: false, message: 'Kuota penggunaan kode promo sudah habis.' };
      }
      if (subtotal < promo.minSubtotal) {
        return {
          ok: false,
          message: `Minimal belanja Rp ${promo.minSubtotal.toLocaleString('id-ID')} untuk menggunakan kode ini.`,
        };
      }

      let diskon =
        promo.type === 'PERCENT'
          ? Math.floor((subtotal * promo.value) / 100)
          : promo.value;

      if (promo.maxDiscount !== null) {
        diskon = Math.min(diskon, promo.maxDiscount);
      }
      diskon = Math.min(diskon, subtotal);

      return {
        ok: true,
        code: promo.code,
        description: promo.description,
        discount: diskon,
        type: promo.type as 'PERCENT' | 'FIXED',
        value: promo.value,
        minSubtotal: promo.minSubtotal,
        maxDiscount: promo.maxDiscount,
      };
    }
  } catch {
    // Database tidak dapat diakses atau timeout -> lanjutkan ke return tidak ditemukan
  }

  return { ok: false, message: 'Kode promo tidak ditemukan atau tidak aktif.' };
}
