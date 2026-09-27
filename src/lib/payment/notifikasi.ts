// Penanganan notifikasi HTTP (webhook) Midtrans.
//
// Fungsi murni dengan dependensi disuntikkan, supaya bisa diuji tanpa database
// dan tanpa jaringan. Route handler cukup membungkusnya:
//
//   export async function POST(req: Request) {
//     const body = await req.json().catch(() => null);
//     const r = await tanganiNotifikasiMidtrans(body, depsProduksi());
//     return Response.json({ hasil: r.hasil }, { status: r.httpStatus });
//   }
//
// Urutan pengamanan: signature -> pesanan ada & dibayar lewat gateway ->
// status diambil ULANG dari API Midtrans (isi notifikasi tidak dipercaya) ->
// jumlah cocok -> transisi status bersyarat (idempoten).
//
// Kode HTTP menentukan pengiriman ulang oleh Midtrans: 2xx berhenti, 500
// dicoba ulang. Galat sementara dijawab 500; hal yang tidak akan berubah
// walau dikirim ulang dijawab 2xx/4xx.

import { nomorPesananDari, verifikasiSignature } from './midtrans';
import { tentukanAksi } from './status';
import type { StatusGateway } from './types';

export type PesananTersimpan = {
  nomorPesanan: string;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  metodeBayar: string;
  grandTotal: number;
  /** id transaksi Midtrans percobaan terakhir; null bila belum pernah dibuka */
  idTransaksiAktif: string | null;
};

export type DepsNotifikasi = {
  serverKey: string;
  cariPesanan(nomorPesanan: string): Promise<PesananTersimpan | null>;
  ambilStatus(idTransaksi: string): Promise<StatusGateway>;
  /** Wajib lewat ubahStatus(): pending -> confirmed bersyarat, paid, paid_at, log status. */
  konfirmasiBayar(nomorPesanan: string, info: { idTransaksi: string; paymentType?: string }): Promise<void>;
  /** Wajib lewat ubahStatus(): pending -> cancelled bersyarat, stok & kuota promo kembali. */
  batalkanOtomatis(nomorPesanan: string, alasan: string): Promise<void>;
  catat(level: 'info' | 'warn' | 'error', pesan: string, data: Record<string, unknown>): void;
};

export type HasilNotifikasi = {
  httpStatus: number;
  hasil:
    | 'dikonfirmasi'
    | 'dibatalkan'
    | 'diabaikan'
    | 'sudah-diproses'
    | 'ditolak'
    | 'perlu-tindakan-admin'
    | 'tidak-ditemukan'
    | 'tidak-valid'
    | 'signature-salah'
    | 'galat';
};

const METODE_GATEWAY = new Set(['qris', 'bank_bca', 'bank_mandiri']);

type BodyNotifikasi = { order_id: string; status_code: string; gross_amount: string; signature_key?: string };

function bacaBody(body: unknown): BodyNotifikasi | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const teks = (k: string) => (typeof b[k] === 'string' ? (b[k] as string) : undefined);
  const order_id = teks('order_id');
  const status_code = teks('status_code');
  const gross_amount = teks('gross_amount');
  if (!order_id || !status_code || !gross_amount) return null;
  return { order_id, status_code, gross_amount, signature_key: teks('signature_key') };
}

export async function tanganiNotifikasiMidtrans(body: unknown, deps: DepsNotifikasi): Promise<HasilNotifikasi> {
  const n = bacaBody(body);
  if (!n) return { httpStatus: 400, hasil: 'tidak-valid' };

  if (!verifikasiSignature(n, deps.serverKey)) {
    deps.catat('warn', 'Notifikasi Midtrans dengan signature salah', { idTransaksi: n.order_id });
    return { httpStatus: 401, hasil: 'signature-salah' };
  }

  const idTransaksi = n.order_id;
  const nomor = nomorPesananDari(idTransaksi);

  try {
    const pesanan = await deps.cariPesanan(nomor);
    if (!pesanan) {
      deps.catat('warn', 'Notifikasi Midtrans untuk pesanan yang tidak ada', { idTransaksi });
      return { httpStatus: 404, hasil: 'tidak-ditemukan' };
    }

    if (!METODE_GATEWAY.has(pesanan.metodeBayar)) {
      deps.catat('warn', 'Notifikasi Midtrans untuk pesanan non-gateway', { nomor, metode: pesanan.metodeBayar });
      return { httpStatus: 200, hasil: 'ditolak' };
    }

    const status = await deps.ambilStatus(idTransaksi);
    const aksi = tentukanAksi(status);

    if (aksi.jenis === 'konfirmasi') {
      if (status.jumlah !== pesanan.grandTotal) {
        deps.catat('error', 'Pembayaran Midtrans: jumlah tidak cocok dengan total pesanan', {
          nomor,
          idTransaksi,
          dibayar: status.jumlah,
          total: pesanan.grandTotal,
        });
        return { httpStatus: 200, hasil: 'ditolak' };
      }
      if (pesanan.paymentStatus === 'paid') return { httpStatus: 200, hasil: 'sudah-diproses' };
      if (pesanan.status === 'cancelled') {
        // Dana masuk setelah pesanan batal (mis. dibayar tepat saat cron
        // membatalkan). Stok mungkin sudah dijual lagi: admin memutuskan
        // refund atau memulihkan pesanan secara manual.
        deps.catat('error', 'Pembayaran diterima untuk pesanan yang sudah dibatalkan, perlu refund/tindakan admin', {
          nomor,
          idTransaksi,
          jumlah: status.jumlah,
        });
        return { httpStatus: 200, hasil: 'perlu-tindakan-admin' };
      }
      if (pesanan.status !== 'pending') {
        deps.catat('warn', 'Pembayaran untuk pesanan yang tidak lagi pending', { nomor, status: pesanan.status });
        return { httpStatus: 200, hasil: 'sudah-diproses' };
      }
      await deps.konfirmasiBayar(nomor, { idTransaksi, paymentType: aksi.paymentType });
      deps.catat('info', 'Pembayaran dikonfirmasi', { nomor, idTransaksi });
      return { httpStatus: 200, hasil: 'dikonfirmasi' };
    }

    if (aksi.jenis === 'batalkan') {
      if (pesanan.status !== 'pending') return { httpStatus: 200, hasil: 'sudah-diproses' };
      // Kedaluwarsanya percobaan lama tidak boleh membatalkan percobaan baru.
      if (pesanan.idTransaksiAktif !== idTransaksi) {
        deps.catat('info', 'Percobaan bayar lama kedaluwarsa, diabaikan', { nomor, idTransaksi });
        return { httpStatus: 200, hasil: 'diabaikan' };
      }
      await deps.batalkanOtomatis(nomor, aksi.alasan);
      return { httpStatus: 200, hasil: 'dibatalkan' };
    }

    deps.catat('info', `Notifikasi Midtrans diabaikan: ${aksi.alasan}`, { nomor, idTransaksi });
    return { httpStatus: 200, hasil: 'diabaikan' };
  } catch (e) {
    deps.catat('error', 'Gagal memproses notifikasi Midtrans', {
      idTransaksi,
      galat: e instanceof Error ? e.message : String(e),
    });
    return { httpStatus: 500, hasil: 'galat' };
  }
}
