// Klien Prisma tunggal untuk server (skill tokokita-akses-data).
//
// Prisma 7 + MySQL wajib memakai driver adapter MariaDB. Singleton di
// globalThis mencegah hot reload `next dev` membuka pool koneksi baru tiap
// kali berkas berubah.

import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { konfigurasiDb } from "@/lib/konfigurasi-db";

const globalUntukPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buatKlien(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });
}

export const prisma = globalUntukPrisma.prisma ?? buatKlien();

if (process.env.NODE_ENV !== "production") globalUntukPrisma.prisma = prisma;
