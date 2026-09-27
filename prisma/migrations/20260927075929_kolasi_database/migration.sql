-- Collation bawaan database = utf8mb4_unicode_ci (PRD §9).
--
-- `prisma migrate reset` membuat ulang database dengan collation bawaan server
-- (MySQL 8: utf8mb4_0900_ai_ci). Tabel dari migration tetap utf8mb4_unicode_ci
-- karena disebut per tabel, tetapi bawaan database perlu disamakan agar tabel
-- atau kolom yang dibuat di luar Prisma tidak berbeda collation.
-- Tanpa nama database: berlaku untuk database yang sedang dipakai koneksi.
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
