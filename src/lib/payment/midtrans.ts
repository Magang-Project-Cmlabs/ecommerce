// Adapter Midtrans Snap untuk TokoKita, memakai fetch bawaan (tanpa SDK).
//
// Rujukan resmi:
// - Snap:   https://docs.midtrans.com/reference/backend-integration
// - Body:   https://docs.midtrans.com/reference/request-body-json-parameter
// - Status: https://docs.midtrans.com/reference/get-transaction-status
// - Notif:  https://docs.midtrans.com/reference/handle-notifications
//
// Hanya dipakai di server. Server key tidak pernah boleh sampai ke client.

import { createHash, timingSafeEqual } from 'node:crypto';
import type { MetodeGateway, PesananUntukBayar, SesiBayar, StatusGateway } from './types';

const BATAS_WAKTU_MS = 10_000;
const PANJANG_NAMA_ITEM = 50;
const WIB_MS = 7 * 60 * 60 * 1000; // Indonesia tanpa DST

/** Kanal Snap yang dibuka per metode bayar PRD §7.6. */
const KANAL: Record<MetodeGateway, string[]> = {
  qris: ['gopay', 'other_qris'], // GoPay + QRIS (OVO, DANA, dll.)
  bank_bca: ['bca_va'],
  bank_mandiri: ['echannel'], // Mandiri Bill Payment
};

export class MidtransError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
  ) {
    super(message);
    this.name = 'MidtransError';
  }
}

// ---------------------------------------------------------------------------
// Konfigurasi

export type KonfigMidtrans = {
  serverKey: string;
  isProduction: boolean;
  snapUrl: string;
  apiUrl: string;
};

export function bacaKonfigMidtrans(env: Record<string, string | undefined> = process.env): KonfigMidtrans {
  const serverKey = env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY belum diisi di .env');

  const isProduction = env.MIDTRANS_IS_PRODUCTION === 'true';
  // Kunci production Midtrans berawalan "Mid-server-", kunci sandbox "SB-Mid-server-".
  if (!isProduction && serverKey.startsWith('Mid-server-')) {
    throw new Error('Kunci production dipakai di mode sandbox. Periksa MIDTRANS_SERVER_KEY dan MIDTRANS_IS_PRODUCTION.');
  }

  return {
    serverKey,
    isProduction,
    snapUrl: isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
    apiUrl: isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com',
  };
}

// ---------------------------------------------------------------------------
// Id transaksi

/**
 * order_id di Midtrans hanya bisa dipakai sekali. Percobaan bayar ulang (setelah
 * deny/cancel/failure) memakai akhiran "~n"; tilde diizinkan Midtrans.
 */
export function idTransaksiGateway(nomorPesanan: string, percobaan: number): string {
  if (!Number.isInteger(percobaan) || percobaan < 1) throw new Error(`Percobaan bayar tidak sah: ${percobaan}`);
  return percobaan === 1 ? nomorPesanan : `${nomorPesanan}~${percobaan}`;
}

export function nomorPesananDari(idTransaksi: string): string {
  return idTransaksi.split('~')[0]!;
}

// ---------------------------------------------------------------------------
// Body Snap

export type ItemSnap = { id: string; name: string; price: number; quantity: number };

export type BodySnap = {
  transaction_details: { order_id: string; gross_amount: number };
  item_details: ItemSnap[];
  customer_details: { first_name: string; email: string; phone?: string };
  enabled_payments: string[];
  expiry: { start_time: string; unit: 'minute'; duration: number };
  callbacks: { finish: string };
};

function wajibRupiah(nilai: number, nama: string, minimal = 0) {
  if (!Number.isInteger(nilai)) throw new Error(`${nama} harus bilangan bulat rupiah, bukan ${nilai}`);
  if (nilai < minimal) throw new Error(`${nama} tidak boleh kurang dari ${minimal}`);
}

/** "2026-09-27 14:30:00 +0700" — format start_time Snap, zona WIB. */
export function formatWaktuWib(waktu: Date): string {
  return new Date(waktu.getTime() + WIB_MS).toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
}

export function buatBodySnap(p: PesananUntukBayar, sekarang: Date = new Date()): BodySnap {
  const kanal = KANAL[p.metode];
  if (!kanal) throw new Error(`Metode ${String(p.metode)} tidak dibayar lewat gateway`);

  wajibRupiah(p.grandTotal, 'grandTotal', 1);
  wajibRupiah(p.ongkir, 'ongkir');
  wajibRupiah(p.diskon, 'diskon');

  const items: ItemSnap[] = p.items.map((i) => {
    wajibRupiah(i.harga, `harga ${i.id}`);
    if (!Number.isInteger(i.jumlah) || i.jumlah < 1) throw new Error(`jumlah ${i.id} tidak sah`);
    return { id: i.id, name: i.nama.slice(0, PANJANG_NAMA_ITEM), price: i.harga, quantity: i.jumlah };
  });
  if (p.ongkir > 0) items.push({ id: 'ONGKIR', name: 'Ongkos kirim', price: p.ongkir, quantity: 1 });
  if (p.diskon > 0) items.push({ id: 'DISKON', name: 'Diskon promo', price: -p.diskon, quantity: 1 });

  // Midtrans menolak transaksi bila jumlah item_details != gross_amount.
  // Tangkap di sini supaya pesannya jelas, bukan galat 400 dari Midtrans.
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (total !== p.grandTotal) {
    throw new Error(`Rincian pesanan ${p.nomorPesanan} (${total}) tidak cocok dengan grandTotal (${p.grandTotal})`);
  }

  // Sesi berakhir tepat di batas bayar pesanan, berapa kali pun dibuka ulang.
  const sisaMenit = Math.ceil((p.batasBayar.getTime() - sekarang.getTime()) / 60_000);
  if (sisaMenit <= 0) throw new Error(`Batas bayar pesanan ${p.nomorPesanan} sudah lewat`);

  return {
    transaction_details: { order_id: idTransaksiGateway(p.nomorPesanan, p.percobaan), gross_amount: p.grandTotal },
    item_details: items,
    customer_details: {
      first_name: p.pelanggan.nama,
      email: p.pelanggan.email,
      ...(p.pelanggan.telepon ? { phone: p.pelanggan.telepon } : {}),
    },
    enabled_payments: kanal,
    expiry: { start_time: formatWaktuWib(sekarang), unit: 'minute', duration: sisaMenit },
    callbacks: { finish: p.urlSelesai },
  };
}

// ---------------------------------------------------------------------------
// Notifikasi

/** "150000.00" -> 150000. Menolak pecahan rupiah dan format aneh. */
export function parseJumlah(teks: string): number {
  const m = /^(\d+)(?:\.00)?$/.exec(teks);
  if (!m) throw new Error(`gross_amount tidak sah: ${JSON.stringify(teks)}`);
  return Number(m[1]);
}

type BagianSignature = { order_id?: string; status_code?: string; gross_amount?: string; signature_key?: string };

/** signature_key = SHA512(order_id + status_code + gross_amount + serverKey) */
export function verifikasiSignature(n: BagianSignature, serverKey: string): boolean {
  if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) return false;
  const harapan = createHash('sha512')
    .update(n.order_id + n.status_code + n.gross_amount + serverKey)
    .digest();
  const diterima = Buffer.from(n.signature_key, 'hex');
  return diterima.length === harapan.length && timingSafeEqual(diterima, harapan);
}

// ---------------------------------------------------------------------------
// Klien HTTP

export type KlienMidtrans = {
  buatSesi(p: PesananUntukBayar, sekarang?: Date): Promise<SesiBayar>;
  ambilStatus(idTransaksi: string): Promise<StatusGateway>;
};

function pesanGalat(body: unknown, cadangan: string): string {
  if (body && typeof body === 'object') {
    const b = body as { error_messages?: unknown; status_message?: unknown; error?: unknown };
    if (Array.isArray(b.error_messages) && b.error_messages.length) return b.error_messages.join('; ');
    if (typeof b.status_message === 'string') return b.status_message;
    if (typeof b.error === 'string') return b.error; // bentuk galat API status: {"error":"Unauthorized"}
  }
  return cadangan;
}

export function buatKlienMidtrans(konfig: KonfigMidtrans, f: typeof fetch = fetch): KlienMidtrans {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + Buffer.from(konfig.serverKey + ':').toString('base64'),
  };

  async function panggil(url: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
    let res: Response;
    try {
      res = await f(url, { ...init, headers, signal: AbortSignal.timeout(BATAS_WAKTU_MS) });
    } catch (e) {
      const nama = e instanceof Error ? e.name : 'Error';
      throw new MidtransError(`Tidak dapat menghubungi Midtrans (${nama})`, 0);
    }
    const body: unknown = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  return {
    async buatSesi(p, sekarang = new Date()) {
      const body = buatBodySnap(p, sekarang);
      const r = await panggil(konfig.snapUrl, { method: 'POST', body: JSON.stringify(body) });
      const b = r.body as { token?: unknown; redirect_url?: unknown } | null;
      if (r.status >= 300 || typeof b?.token !== 'string' || typeof b.redirect_url !== 'string') {
        throw new MidtransError(`Gagal membuat sesi bayar: ${pesanGalat(r.body, `HTTP ${r.status}`)}`, r.status);
      }
      return { idTransaksi: body.transaction_details.order_id, token: b.token, urlBayar: b.redirect_url };
    },

    async ambilStatus(idTransaksi) {
      const r = await panggil(`${konfig.apiUrl}/v2/${encodeURIComponent(idTransaksi)}/status`, { method: 'GET' });
      const b = r.body as Record<string, unknown> | null;
      // Transaksi yang tidak ada dijawab HTTP 200 dengan status_code "404" di body.
      if (r.status >= 300 || typeof b?.transaction_status !== 'string' || typeof b.gross_amount !== 'string') {
        const kode = typeof b?.status_code === 'string' ? Number(b.status_code) : r.status;
        throw new MidtransError(`Gagal mengambil status ${idTransaksi}: ${pesanGalat(r.body, `HTTP ${r.status}`)}`, kode);
      }
      return {
        idTransaksi: String(b.order_id ?? idTransaksi),
        transactionStatus: b.transaction_status,
        statusCode: String(b.status_code ?? ''),
        jumlah: parseJumlah(b.gross_amount),
        paymentType: typeof b.payment_type === 'string' ? b.payment_type : undefined,
        fraudStatus: typeof b.fraud_status === 'string' ? b.fraud_status : undefined,
      };
    },
  };
}
