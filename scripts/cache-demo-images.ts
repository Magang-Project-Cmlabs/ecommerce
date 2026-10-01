// Cache foto contoh agar demo lokal tidak bergantung pada Picsum saat dibuka.
// Hanya URL seed tokokita pada tabel gambar yang diperbarui; bukan reset DB.
import 'dotenv/config';
import path from 'node:path';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import { konfigurasiDb } from '../src/lib/konfigurasi-db';
import sharp from 'sharp';

const db = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });
async function main() {
  const [images, categories, banners] = await Promise.all([
    db.productImage.findMany(), db.category.findMany(), db.banner.findMany(),
  ]);
  const urls = [...new Set([...images.map(i => i.url), ...categories.map(c => c.image), ...banners.map(b => b.image)])]
    .filter((u): u is string => typeof u === 'string' && /^https:\/\/picsum\.photos\/seed\/tokokita-[a-z0-9-]+\/800\/800$/.test(u));
  await mkdir(path.resolve('public/demo'), { recursive: true });
  const cached = new Map<string, string>();
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.all(urls.slice(i, i + 6).map(async url => {
      const name = new URL(url).pathname.split('/')[2]! + '.webp';
      const filename = path.resolve('public/demo', name);
      try { await access(filename); }
      catch {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`Foto demo gagal: HTTP ${response.status}`);
        const bytes = await sharp(Buffer.from(await response.arrayBuffer())).webp({ quality: 80 }).toBuffer();
        await writeFile(filename, bytes);
      }
      cached.set(url, `/demo/${name}`);
    }));
  }
  if (cached.size) await db.$transaction(async tx => {
    const pairs = [...cached];
    const choices = Prisma.join(pairs.map(([url, local]) => Prisma.sql`WHEN ${url} THEN ${local}`), ' ');
    const source = Prisma.join(pairs.map(([url]) => url));
    // Tiga query terikat, bukan ratusan roundtrip saat database berada di Aiven.
    await tx.$executeRaw`UPDATE product_images SET url = CASE url ${choices} ELSE url END WHERE url IN (${source})`;
    await tx.$executeRaw`UPDATE categories SET image = CASE image ${choices} ELSE image END WHERE image IN (${source})`;
    await tx.$executeRaw`UPDATE banners SET image = CASE image ${choices} ELSE image END WHERE image IN (${source})`;
  }, { timeout: 30000 });
  console.log(`${cached.size} foto demo disimpan lokal; stok, pesanan, dan akun tidak berubah.`);
}
main().catch(e => { console.error(e instanceof Error ? e.message : 'Cache gagal'); process.exitCode = 1; }).finally(() => db.$disconnect());
