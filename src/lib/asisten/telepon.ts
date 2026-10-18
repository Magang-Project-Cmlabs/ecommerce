// Penyamaran nomor HP untuk asisten (D23). Dipakai di browser sebelum riwayat dikirim: nomor HP
// pembeli diganti token NOMOR_HP_n, sehingga server dan penyedia AI tidak pernah menerima nomornya.
// Server menjalankan penyamaran yang sama sekali lagi (klien tidak dipercaya). Saat asisten
// mengusulkan draf alamat berisi token, browser mengembalikan nomor aslinya.

// Pemisah yang lazim dipakai: spasi, titik, strip, kurung, garis miring.
const POLA_HP = /(?<![\d+])\(?(?:\+62|62|0)[\s.\-()/]*8(?:[\s.\-()/]*\d){7,12}(?!\d)/g;

export type PetaTelepon = Record<string, string>;

/** Samarkan nomor HP di pesan pengguna. Urutan tetap, jadi token sama di setiap pengiriman. */
export function samarkanTeleponRiwayat<T extends { peran: 'pengguna' | 'asisten'; isi: string }>(riwayat: readonly T[]): { riwayat: T[]; peta: PetaTelepon } {
  const peta: PetaTelepon = {};
  const tokenDari = new Map<string, string>();
  const hasil = riwayat.map((m) => (m.peran !== 'pengguna' ? m : {
    ...m,
    isi: m.isi.replace(POLA_HP, (nomor) => {
      const normal = nomor.replace(/[^\d+]/g, '');
      let token = tokenDari.get(normal);
      if (!token) { token = `NOMOR_HP_${tokenDari.size + 1}`; tokenDari.set(normal, token); peta[token] = normal; }
      return token;
    }),
  }));
  return { riwayat: hasil, peta };
}

/** Ganti token dengan nomor asli. Token yang tidak dikenal menjadi kosong (pembeli mengisi sendiri). */
export function kembalikanTelepon(nilai: string, peta: PetaTelepon): string {
  return /^NOMOR_HP_\d{1,2}$/.test(nilai) ? (peta[nilai] ?? '') : nilai;
}
