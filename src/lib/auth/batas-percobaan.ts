// Batas percobaan per kunci (mis. "masuk:<ip>") dengan jendela bergeser.
// PRD §13: 5 percobaan / 15 menit per IP. Disimpan di memori proses
// (OPEN_DECISIONS D4 opsi A): syaratnya PM2 satu instance; hitungan hilang saat
// restart — dapat diterima.

type Hasil = { boleh: true } | { boleh: false; tungguDetik: number };

export function buatPembatas({ maks, jendelaMs, jam = Date.now }: { maks: number; jendelaMs: number; jam?: () => number }) {
  /** kunci → waktu percobaan yang masih di dalam jendela, urut naik. */
  const catatan = new Map<string, number[]>();
  let bersihBerikutnya = 0;

  function buangKedaluwarsa(sekarang: number) {
    if (sekarang < bersihBerikutnya) return;
    bersihBerikutnya = sekarang + jendelaMs;
    for (const [kunci, waktu] of catatan) {
      const terakhir = waktu.at(-1);
      if (terakhir === undefined || terakhir <= sekarang - jendelaMs) catatan.delete(kunci);
    }
  }

  return {
    /** Catat satu percobaan. Percobaan yang ditolak tidak ikut dihitung. */
    catat(kunci: string): Hasil {
      const sekarang = jam();
      buangKedaluwarsa(sekarang);
      const waktu = (catatan.get(kunci) ?? []).filter((w) => w > sekarang - jendelaMs);
      if (waktu.length >= maks) {
        catatan.set(kunci, waktu);
        return { boleh: false, tungguDetik: Math.ceil(((waktu[0] ?? sekarang) + jendelaMs - sekarang) / 1000) };
      }
      waktu.push(sekarang);
      catatan.set(kunci, waktu);
      return { boleh: true };
    },
    hapus(kunci: string) {
      catatan.delete(kunci);
    },
    ukuran() {
      return catatan.size;
    },
  };
}

/** Pembatas bersama untuk masuk, daftar, dan lupa password (kunci diberi awalan aksi). */
export const batasAuth = buatPembatas({ maks: 5, jendelaMs: 15 * 60 * 1000 });

export function pesanTerlaluSering(tungguDetik: number): string {
  const menit = Math.max(1, Math.ceil(tungguDetik / 60));
  return `Terlalu banyak percobaan. Coba lagi dalam ${menit} menit.`;
}
