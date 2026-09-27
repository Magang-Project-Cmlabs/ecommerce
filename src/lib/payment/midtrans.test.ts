import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  MidtransError,
  bacaKonfigMidtrans,
  buatBodySnap,
  buatKlienMidtrans,
  idTransaksiGateway,
  nomorPesananDari,
  parseJumlah,
  verifikasiSignature,
} from './midtrans';
import type { PesananUntukBayar } from './types';

const SERVER_KEY = 'SB-Mid-server-contohKunciUji';
const SEKARANG = new Date('2026-09-27T07:30:00.000Z'); // 14.30 WIB

function pesanan(ubah: Partial<PesananUntukBayar> = {}): PesananUntukBayar {
  return {
    nomorPesanan: 'INV-202609-0001',
    percobaan: 1,
    metode: 'bank_bca',
    items: [
      { id: 'var-12', nama: 'Kaos Polos Premium - M', harga: 89_000, jumlah: 2 },
      { id: 'prd-7', nama: 'Celana Chino', harga: 149_000, jumlah: 1 },
    ],
    ongkir: 30_000,
    diskon: 32_700,
    grandTotal: 89_000 * 2 + 149_000 + 30_000 - 32_700,
    dibuatPada: new Date('2026-09-27T07:00:00.000Z'),
    batasBayar: new Date('2026-09-28T07:00:00.000Z'),
    pelanggan: { nama: 'Demo Pembeli', email: 'demo@example.com', telepon: '08123456789' },
    urlSelesai: 'http://localhost:3000/akun/pesanan/INV-202609-0001',
    ...ubah,
  };
}

describe('idTransaksiGateway / nomorPesananDari', () => {
  it('percobaan pertama memakai nomor pesanan apa adanya', () => {
    expect(idTransaksiGateway('INV-202609-0001', 1)).toBe('INV-202609-0001');
  });

  it('percobaan berikutnya diberi akhiran ~n dan bisa dibaca balik', () => {
    const id = idTransaksiGateway('INV-202609-0001', 3);
    expect(id).toBe('INV-202609-0001~3');
    expect(nomorPesananDari(id)).toBe('INV-202609-0001');
    expect(nomorPesananDari('INV-202609-0001')).toBe('INV-202609-0001');
  });

  it('menolak nomor percobaan yang tidak sah', () => {
    expect(() => idTransaksiGateway('INV-202609-0001', 0)).toThrow();
    expect(() => idTransaksiGateway('INV-202609-0001', 1.5)).toThrow();
  });
});

describe('buatBodySnap', () => {
  it('gross_amount sama dengan grand total dan jumlah item_details cocok', () => {
    const body = buatBodySnap(pesanan(), SEKARANG);
    expect(body.transaction_details).toEqual({ order_id: 'INV-202609-0001', gross_amount: 324_300 });
    const total = body.item_details.reduce((s, i) => s + i.price * i.quantity, 0);
    expect(total).toBe(324_300);
  });

  it('ongkir dan diskon menjadi baris item tersendiri', () => {
    const body = buatBodySnap(pesanan(), SEKARANG);
    expect(body.item_details).toContainEqual({ id: 'ONGKIR', name: 'Ongkos kirim', price: 30_000, quantity: 1 });
    expect(body.item_details).toContainEqual({ id: 'DISKON', name: 'Diskon promo', price: -32_700, quantity: 1 });
  });

  it('tanpa ongkir atau diskon, barisnya tidak ditambahkan', () => {
    const body = buatBodySnap(pesanan({ ongkir: 0, diskon: 0, grandTotal: 327_000 }), SEKARANG);
    expect(body.item_details.map((i) => i.id)).toEqual(['var-12', 'prd-7']);
  });

  it('menolak pesanan yang totalnya tidak cocok dengan rinciannya', () => {
    expect(() => buatBodySnap(pesanan({ grandTotal: 999 }), SEKARANG)).toThrow(/tidak cocok/);
  });

  it('menolak angka rupiah yang bukan bilangan bulat', () => {
    expect(() => buatBodySnap(pesanan({ ongkir: 15_000.5 }), SEKARANG)).toThrow(/bilangan bulat/);
  });

  it.each([
    ['qris', ['gopay', 'other_qris']],
    ['bank_bca', ['bca_va']],
    ['bank_mandiri', ['echannel']],
  ] as const)('metode %s hanya membuka kanal %j', (metode, kanal) => {
    expect(buatBodySnap(pesanan({ metode }), SEKARANG).enabled_payments).toEqual(kanal);
  });

  it('masa berlaku sesi berakhir tepat di batas bayar pesanan (WIB)', () => {
    const body = buatBodySnap(pesanan(), SEKARANG);
    // 14.30 WIB tanggal 27 sampai 14.00 WIB tanggal 28 = 23,5 jam
    expect(body.expiry).toEqual({ start_time: '2026-09-27 14:30:00 +0700', unit: 'minute', duration: 1410 });
  });

  it('menolak membuka sesi setelah batas bayar lewat', () => {
    const lewat = new Date('2026-09-28T07:00:00.000Z');
    expect(() => buatBodySnap(pesanan(), lewat)).toThrow(/batas bayar/i);
  });

  it('nama item dipotong maksimal 50 karakter', () => {
    const panjang = 'x'.repeat(80);
    const body = buatBodySnap(
      pesanan({ items: [{ id: 'a', nama: panjang, harga: 1000, jumlah: 1 }], ongkir: 0, diskon: 0, grandTotal: 1000 }),
      SEKARANG,
    );
    expect(body.item_details[0]!.name).toHaveLength(50);
  });

  it('memakai id transaksi percobaan dan URL selesai', () => {
    const body = buatBodySnap(pesanan({ percobaan: 2 }), SEKARANG);
    expect(body.transaction_details.order_id).toBe('INV-202609-0001~2');
    expect(body.callbacks).toEqual({ finish: 'http://localhost:3000/akun/pesanan/INV-202609-0001' });
    expect(body.customer_details).toEqual({ first_name: 'Demo Pembeli', email: 'demo@example.com', phone: '08123456789' });
  });
});

describe('parseJumlah', () => {
  it.each([
    ['150000.00', 150_000],
    ['150000', 150_000],
    ['0.00', 0],
  ])('%s -> %i', (masuk, keluar) => {
    expect(parseJumlah(masuk)).toBe(keluar);
  });

  it.each(['150000.50', 'abc', '', '-100.00', '1e5'])('menolak %j', (masuk) => {
    expect(() => parseJumlah(masuk)).toThrow();
  });
});

describe('verifikasiSignature', () => {
  const notif = { order_id: 'INV-202609-0001', status_code: '200', gross_amount: '324300.00' };
  const sah = createHash('sha512')
    .update(notif.order_id + notif.status_code + notif.gross_amount + SERVER_KEY)
    .digest('hex');

  it('menerima signature yang dihitung dari server key yang benar', () => {
    expect(verifikasiSignature({ ...notif, signature_key: sah }, SERVER_KEY)).toBe(true);
  });

  it('menolak jika jumlah diubah', () => {
    expect(verifikasiSignature({ ...notif, gross_amount: '1.00', signature_key: sah }, SERVER_KEY)).toBe(false);
  });

  it('menolak jika server key berbeda', () => {
    expect(verifikasiSignature({ ...notif, signature_key: sah }, 'SB-Mid-server-lain')).toBe(false);
  });

  it('menolak signature kosong atau panjangnya salah tanpa melempar error', () => {
    expect(verifikasiSignature({ ...notif, signature_key: '' }, SERVER_KEY)).toBe(false);
    expect(verifikasiSignature({ ...notif, signature_key: 'abc' }, SERVER_KEY)).toBe(false);
    expect(verifikasiSignature({ ...notif }, SERVER_KEY)).toBe(false);
  });
});

describe('bacaKonfigMidtrans', () => {
  it('memakai sandbox secara bawaan', () => {
    const k = bacaKonfigMidtrans({ MIDTRANS_SERVER_KEY: SERVER_KEY });
    expect(k.isProduction).toBe(false);
    expect(k.snapUrl).toBe('https://app.sandbox.midtrans.com/snap/v1/transactions');
    expect(k.apiUrl).toBe('https://api.sandbox.midtrans.com');
  });

  it('memakai endpoint production bila diminta', () => {
    const k = bacaKonfigMidtrans({ MIDTRANS_SERVER_KEY: 'Mid-server-asli', MIDTRANS_IS_PRODUCTION: 'true' });
    expect(k.snapUrl).toBe('https://app.midtrans.com/snap/v1/transactions');
    expect(k.apiUrl).toBe('https://api.midtrans.com');
  });

  it('gagal jika server key kosong', () => {
    expect(() => bacaKonfigMidtrans({})).toThrow(/MIDTRANS_SERVER_KEY/);
  });

  it('menolak kunci production di mode sandbox', () => {
    expect(() => bacaKonfigMidtrans({ MIDTRANS_SERVER_KEY: 'Mid-server-asli' })).toThrow(/production/);
  });
});

describe('klien Midtrans', () => {
  const konfig = bacaKonfigMidtrans({ MIDTRANS_SERVER_KEY: SERVER_KEY });
  const authSah = 'Basic ' + Buffer.from(SERVER_KEY + ':').toString('base64');

  function fetchPalsu(status: number, body: unknown) {
    return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
    );
  }

  it('membuat sesi Snap dengan autentikasi Basic dan body yang benar', async () => {
    const f = fetchPalsu(201, { token: 'tok-1', redirect_url: 'https://app.sandbox.midtrans.com/snap/v4/redirection/tok-1' });
    const klien = buatKlienMidtrans(konfig, f as unknown as typeof fetch);

    const sesi = await klien.buatSesi(pesanan(), SEKARANG);

    expect(sesi).toEqual({
      idTransaksi: 'INV-202609-0001',
      token: 'tok-1',
      urlBayar: 'https://app.sandbox.midtrans.com/snap/v4/redirection/tok-1',
    });
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe('https://app.sandbox.midtrans.com/snap/v1/transactions');
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe(authSah);
    expect(headers.get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init?.body)).transaction_details.gross_amount).toBe(324_300);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('galat dari Midtrans dilempar sebagai MidtransError tanpa membocorkan server key', async () => {
    const f = fetchPalsu(400, { error_messages: ['transaction_details.order_id sudah digunakan'] });
    const klien = buatKlienMidtrans(konfig, f as unknown as typeof fetch);

    const galat = await klien.buatSesi(pesanan(), SEKARANG).catch((e: unknown) => e);

    expect(galat).toBeInstanceOf(MidtransError);
    expect((galat as MidtransError).httpStatus).toBe(400);
    expect((galat as MidtransError).message).toContain('order_id sudah digunakan');
    expect((galat as MidtransError).message).not.toContain(SERVER_KEY);
  });

  it('kunci salah pada API status menghasilkan MidtransError 401 yang terbaca', async () => {
    const klien = buatKlienMidtrans(konfig, fetchPalsu(401, { error: 'Unauthorized' }) as unknown as typeof fetch);
    const galat = await klien.ambilStatus('INV-202609-0001').catch((e: unknown) => e);
    expect(galat).toBeInstanceOf(MidtransError);
    expect((galat as MidtransError).httpStatus).toBe(401);
    expect((galat as MidtransError).message).toContain('Unauthorized');
  });

  it('transaksi yang tidak ada (HTTP 200, status_code 404 di body) dianggap galat 404', async () => {
    const f = fetchPalsu(200, { status_code: '404', status_message: "Transaction doesn't exist." });
    const galat = await buatKlienMidtrans(konfig, f as unknown as typeof fetch).ambilStatus('X').catch((e: unknown) => e);
    expect((galat as MidtransError).httpStatus).toBe(404);
  });

  it('jaringan putus dilaporkan sebagai MidtransError, bukan galat mentah', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    const galat = await buatKlienMidtrans(konfig, f as unknown as typeof fetch).ambilStatus('X').catch((e: unknown) => e);
    expect(galat).toBeInstanceOf(MidtransError);
    expect((galat as MidtransError).httpStatus).toBe(0);
  });

  it('mengambil status transaksi dan menormalkan jumlahnya', async () => {
    const f = fetchPalsu(200, {
      order_id: 'INV-202609-0001~2',
      transaction_status: 'settlement',
      status_code: '200',
      gross_amount: '324300.00',
      payment_type: 'bank_transfer',
    });
    const klien = buatKlienMidtrans(konfig, f as unknown as typeof fetch);

    const s = await klien.ambilStatus('INV-202609-0001~2');

    expect(f.mock.calls[0]![0]).toBe('https://api.sandbox.midtrans.com/v2/INV-202609-0001~2/status');
    expect(new Headers(f.mock.calls[0]![1]?.headers).get('authorization')).toBe(authSah);
    expect(s).toEqual({
      idTransaksi: 'INV-202609-0001~2',
      transactionStatus: 'settlement',
      statusCode: '200',
      jumlah: 324_300,
      paymentType: 'bank_transfer',
      fraudStatus: undefined,
    });
  });
});
