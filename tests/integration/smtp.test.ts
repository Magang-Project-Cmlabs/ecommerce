// Loopback SMTP integration: real Nodemailer + real MySQL, no external mail.
import { createServer, type Server, type Socket } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
const request = vi.hoisted(() => ({ id: 0 }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn(async () => ({ id: request.id, name: 'Pembeli SMTP', email: 'smtp-capture@example.test', role: 'customer' })) }));
vi.mock('@/lib/data/pengguna', () => ({ ambilPenggunaSaatIni: vi.fn(async () => ({ id: request.id })) }));
import { prisma } from '@/lib/db';
import { buatPesanan } from '@/actions/checkout';
let server: Server;
const sockets = new Set<Socket>();
const messages: string[] = [];
const committedAtSMTP: number[] = [];
let rejectMessage = false;
let rejectedCount = 0;
let categoryId = 0;
let productId = 0;
let addressId = 0;
const stamp = Date.now();
function startSMTP(socket: Socket) {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.on('error', () => undefined);
  socket.setEncoding('utf8');
  socket.write('220 localhost TokoKita loopback capture\r\n');
  let buffer = '';
  let dataMode = false;
  let message: string[] = [];
  socket.on('data', chunk => {
    buffer += String(chunk);
    while (buffer.includes('\r\n')) {
      const position = buffer.indexOf('\r\n');
      const line = buffer.slice(0, position);
      buffer = buffer.slice(position + 2);
      if (dataMode) {
        if (line === '.') {
          dataMode = false;
          if (rejectMessage) { rejectedCount++; socket.write('552 Requested mail action aborted: test rejection\r\n'); }
          else {
            const raw = message.join('\r\n');
            const invoice = raw.match(/INV-\d{6}-\d{4,9}/)?.[0];
            // Query while SMTP DATA is pending: the sender must already have
            // committed the order before delivering any notification.
            void prisma.order.count({ where: { orderNumber: invoice ?? 'missing', userId: request.id } }).then(count => {
              committedAtSMTP.push(count);
              messages.push(raw);
              socket.write('250 Captured locally\r\n');
            }).catch(() => socket.write('552 Database verification failed\r\n'));
          }
          message = [];
        } else message.push(line.startsWith('..') ? line.slice(1) : line);
      } else if (/^(EHLO|HELO)\b/i.test(line)) socket.write('250-localhost\r\n250 SIZE 10485760\r\n');
      else if (/^DATA$/i.test(line)) { dataMode = true; socket.write('354 End data with <CRLF>.<CRLF>\r\n'); }
      else if (/^QUIT$/i.test(line)) socket.end('221 Bye\r\n');
      else socket.write('250 OK\r\n');
    }
  });
}
const input = () => ({ addressId, shippingMethod: 'jne_reg' as const, paymentMethod: 'cod' as const, items: [{ productId, variantId: null, quantity: 1 }] });
beforeAll(async () => {
  const database = new URL(process.env.DATABASE_URL!).pathname;
  if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('SMTP integration requires isolated test database');
  server = createServer(startSMTP);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Loopback listener failed');
  vi.stubEnv('SMTP_HOST', '127.0.0.1'); vi.stubEnv('SMTP_PORT', String(address.port)); vi.stubEnv('SMTP_USER', ''); vi.stubEnv('SMTP_PASS', ''); vi.stubEnv('MAIL_FROM', 'TokoKita <store@example.test>');
  categoryId = (await prisma.category.create({ data: { name: 'Kategori SMTP', slug: `smtp-${stamp}` } })).id;
  request.id = (await prisma.user.create({ data: { name: 'Pembeli SMTP', email: `smtp-${stamp}@example.test`, passwordHash: 'unused-test-boundary', role: 'customer' } })).id;
  addressId = (await prisma.address.create({ data: { userId: request.id, label: 'Rumah', name: 'Penerima', phone: '081234567890', street: 'Jalan SMTP Nomor 1', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820', isDefault: true } })).id;
  productId = (await prisma.product.create({ data: { name: 'Produk SMTP', slug: `smtp-produk-${stamp}`, description: 'Produk untuk pengujian pengiriman email lokal.', specs: {}, tags: [], brand: 'TokoKita', price: 150000, weight: 100, stock: 5, categoryId } })).id;
});
afterAll(async () => {
  if (request.id) {
    const orders = await prisma.order.findMany({ where: { userId: request.id }, select: { id: true } });
    const ids = orders.map(o => o.id);
    await prisma.orderStatusLog.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await prisma.address.deleteMany({ where: { userId: request.id } });
    await prisma.user.delete({ where: { id: request.id } });
  }
  if (productId) await prisma.product.delete({ where: { id: productId } });
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
  for (const socket of sockets) socket.destroy();
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  vi.unstubAllEnvs();
  await prisma.$disconnect();
});
describe('SMTP loopback dengan transaksi pesanan nyata', () => {
  it('pesanan commit dan Nodemailer benar-benar mengirim invoice ke SMTP lokal', async () => {
    const result = await buatPesanan(input());
    expect(result.ok, JSON.stringify(result)).toBe(true);
    if (!result.ok) throw new Error('Pesanan gagal');
    // Email dikirim setelah respons (after/tanpa ditunggu): tunggu sampai SMTP menerimanya.
    await vi.waitFor(() => expect(messages).toHaveLength(1), { timeout: 10_000 });
    expect(committedAtSMTP).toEqual([1]);
    expect(messages[0]).toContain(result.orderNumber);
    expect(messages[0]).toContain(`smtp-${stamp}@example.test`);
    expect(messages[0]).toMatch(/Content-Type: multipart\/alternative/);
    expect(await prisma.order.count({ where: { orderNumber: result.orderNumber, userId: request.id } })).toBe(1);
  });
  it('SMTP menolak email: pesanan dan pengurangan stok tetap commit, tanpa email sukses palsu', async () => {
    rejectMessage = true;
    const before = (await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock;
    const count = messages.length;
    const result = await buatPesanan(input());
    expect(result.ok, JSON.stringify(result)).toBe(true);
    if (!result.ok) throw new Error('Pesanan dibatalkan oleh kegagalan SMTP');
    const persisted = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber }, include: { items: true, statusLogs: true } });
    expect(persisted.status).toBe('confirmed'); expect(persisted.paymentStatus).toBe('unpaid');
    expect(persisted.items).toHaveLength(1); expect(persisted.statusLogs).toHaveLength(1);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(before - 1);
    await vi.waitFor(() => expect(rejectedCount).toBe(1), { timeout: 10_000 });
    expect(messages).toHaveLength(count);
  });
});
