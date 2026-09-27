// Klien Prisma tunggal untuk server (skill tokokita-akses-data).
//
// Prisma 7 + MySQL wajib memakai driver adapter MariaDB. Singleton di
// globalThis mencegah hot reload `next dev` membuka pool koneksi baru tiap
// kali berkas berubah.

import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalUntukPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buatKlien(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diisi di .env");
  return new PrismaClient({ adapter: new PrismaMariaDb(url) });
}

export const prisma = globalUntukPrisma.prisma ?? buatKlien();

if (process.env.NODE_ENV !== "production") globalUntukPrisma.prisma = prisma;
