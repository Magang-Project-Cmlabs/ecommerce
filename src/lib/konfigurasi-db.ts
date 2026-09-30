// Konfigurasi koneksi untuk driver adapter MariaDB, dipakai src/lib/db.ts dan
// prisma/seed.ts.
//
// MySQL lokal cukup DATABASE_URL. MySQL terkelola (mis. Aiven) mewajibkan TLS
// dan memakai CA milik sendiri yang tidak dikenal Node.js, sedangkan lewat URL
// driver hanya menerima `ssl=true` tanpa CA. Karena itu bila DATABASE_CA_CERT
// diisi, URL diurai menjadi objek konfigurasi dengan `ssl.ca`, sehingga
// sertifikat server tetap diverifikasi (bukan `rejectUnauthorized: false`).

export type KonfigurasiDb =
  | string
  | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      ssl: { ca: string; rejectUnauthorized: true };
      connectTimeout: number;
      connectionLimit?: number;
    };

// Bawaan driver 1 detik. Jabat tangan TCP + MySQL + TLS ke server di benua lain
// (mis. fungsi Vercel di AS ke Aiven di Singapura) bisa lebih lama; kalau
// terlampaui, pool terus gagal dan kueri berakhir "pool timeout" setelah 10 detik.
const BATAS_SAMBUNG_MS = 10_000;

function angkaPositif(nilai: string | null): number | undefined {
  const angka = Number(nilai);
  return nilai !== null && Number.isInteger(angka) && angka > 0 ? angka : undefined;
}

export function konfigurasiDb(env: Record<string, string | undefined>): KonfigurasiDb {
  const alamat = env.DATABASE_URL?.trim();
  if (!alamat) throw new Error('DATABASE_URL belum diisi di .env');

  const ca = env.DATABASE_CA_CERT?.trim().replaceAll('\\n', '\n');
  if (!ca) return alamat;
  if (!ca.includes('-----BEGIN CERTIFICATE-----')) {
    throw new Error('DATABASE_CA_CERT harus berisi sertifikat CA berformat PEM');
  }

  // Pesan galat tidak pernah memuat URL: di dalamnya ada password.
  let url: URL;
  try {
    url = new URL(alamat);
  } catch {
    throw new Error('DATABASE_URL bukan URL yang sah');
  }
  if (url.protocol !== 'mysql:' && url.protocol !== 'mariadb:') {
    throw new Error('DATABASE_URL harus berawalan mysql://');
  }

  const batasKoneksi = angkaPositif(url.searchParams.get('connectionLimit'));
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    ssl: { ca, rejectUnauthorized: true },
    connectTimeout: angkaPositif(url.searchParams.get('connectTimeout')) ?? BATAS_SAMBUNG_MS,
    ...(batasKoneksi ? { connectionLimit: batasKoneksi } : {}),
  };
}
