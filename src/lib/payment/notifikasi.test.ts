import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { tanganiNotifikasiMidtrans, type DepsNotifikasi, type PesananTersimpan } from './notifikasi';
import type { StatusGateway } from './types';

const SERVER_KEY = 'SB-Mid-server-contohKunciUji';

function notifikasi(ubah: Record<string, string> = {}) {
  const n: Record<string, string> = {
    order_id: 'INV-202609-0001',
    status_code: '200',
    gross_amount: '324300.00',
    transaction_status: 'settlement',
    payment_type: 'bank_transfer',
    ...ubah,
  };
  n.signature_key ??= createHash('sha512')
    .update(n.order_id! + n.status_code! + n.gross_amount! + SERVER_KEY)
    .digest('hex');
  return n;
}

function siapkan(opsi: { pesanan?: PesananTersimpan | null; statusApi?: Partial<StatusGateway> | Error } = {}) {
  const pesanan: PesananTersimpan | null =
    opsi.pesanan === undefined
      ? {
          nomorPesanan: 'INV-202609-0001',
          status: 'pending',
          paymentStatus: 'unpaid',
          metodeBayar: 'bank_bca',
          grandTotal: 324_300,
          idTransaksiAktif: 'INV-202609-0001',
        }
      : opsi.pesanan;

  const deps: DepsNotifikasi = {
    serverKey: SERVER_KEY,
    cariPesanan: vi.fn(async () => pesanan),
    ambilStatus: vi.fn(async (id: string) => {
      if (opsi.statusApi instanceof Error) throw opsi.statusApi;
      return {
        idTransaksi: id,
        transactionStatus: 'settlement',
        statusCode: '200',
        jumlah: 324_300,
        paymentType: 'bank_transfer',
        ...opsi.statusApi,
      };
    }),
    konfirmasiBayar: vi.fn(async () => true),
    batalkanOtomatis: vi.fn(async () => true),
    catat: vi.fn(),
  };
  return deps;
}

describe('tanganiNotifikasiMidtrans', () => {
  it('pembayaran lunas mengonfirmasi pesanan pending tepat sekali', async () => {
    const deps = siapkan();
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'dikonfirmasi' });
    expect(deps.konfirmasiBayar).toHaveBeenCalledTimes(1);
    expect(deps.konfirmasiBayar).toHaveBeenCalledWith('INV-202609-0001', {
      idTransaksi: 'INV-202609-0001',
      paymentType: 'bank_transfer',
    });
  });

  it('signature palsu ditolak sebelum menyentuh database atau Midtrans', async () => {
    const deps = siapkan();
    const hasil = await tanganiNotifikasiMidtrans(notifikasi({ signature_key: 'palsu' }), deps);

    expect(hasil.httpStatus).toBe(401);
    expect(hasil.hasil).toBe('signature-salah');
    expect(deps.cariPesanan).not.toHaveBeenCalled();
    expect(deps.ambilStatus).not.toHaveBeenCalled();
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
  });

  it('body yang tidak lengkap ditolak 400', async () => {
    const deps = siapkan();
    expect((await tanganiNotifikasiMidtrans({ order_id: 'x' }, deps)).httpStatus).toBe(400);
    expect((await tanganiNotifikasiMidtrans(null, deps)).httpStatus).toBe(400);
  });

  it('status diambil ulang dari API Midtrans; isi notifikasi tidak dipercaya begitu saja', async () => {
    const deps = siapkan({ statusApi: { transactionStatus: 'pending', statusCode: '201' } });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(deps.ambilStatus).toHaveBeenCalledWith('INV-202609-0001');
    expect(hasil.hasil).toBe('diabaikan');
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
  });

  it('API status gagal dijawab 500 agar Midtrans mengirim ulang', async () => {
    const deps = siapkan({ statusApi: new Error('timeout') });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil).toEqual({ httpStatus: 500, hasil: 'galat' });
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
  });

  it('pesanan tidak ditemukan dijawab 404', async () => {
    const deps = siapkan({ pesanan: null });
    expect(await tanganiNotifikasiMidtrans(notifikasi(), deps)).toEqual({ httpStatus: 404, hasil: 'tidak-ditemukan' });
  });

  it('jumlah dibayar yang berbeda dari total pesanan tidak dikonfirmasi', async () => {
    const deps = siapkan({ statusApi: { jumlah: 1_000 } });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'ditolak' });
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
    expect(deps.catat).toHaveBeenCalledWith('error', expect.stringContaining('jumlah'), expect.anything());
  });

  it('notifikasi ganda untuk pesanan yang sudah lunas tidak mengonfirmasi dua kali', async () => {
    const deps = siapkan({
      pesanan: {
        nomorPesanan: 'INV-202609-0001',
        status: 'confirmed',
        paymentStatus: 'paid',
        metodeBayar: 'bank_bca',
        grandTotal: 324_300,
        idTransaksiAktif: 'INV-202609-0001',
      },
    });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'sudah-diproses' });
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
  });

  it('transfer kedua lewat percobaan lain untuk pesanan yang sudah lunas ditandai untuk admin', async () => {
    const deps = siapkan({
      pesanan: {
        nomorPesanan: 'INV-202609-0001',
        status: 'confirmed',
        paymentStatus: 'paid',
        metodeBayar: 'bank_bca',
        grandTotal: 324_300,
        idTransaksiAktif: 'INV-202609-0001', // percobaan yang sudah dibayar
      },
    });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi({ order_id: 'INV-202609-0001~2' }), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'perlu-tindakan-admin' });
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
    expect(deps.catat).toHaveBeenCalledWith('error', expect.stringContaining('ganda'), expect.anything());
  });

  it('notifikasi yang kalah balapan (transisi tidak terjadi) tidak dilaporkan dikonfirmasi', async () => {
    const deps = siapkan();
    deps.konfirmasiBayar = vi.fn(async () => false); // request paralel lain sudah mengonfirmasi
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'sudah-diproses' });
    expect(deps.catat).not.toHaveBeenCalledWith('info', 'Pembayaran dikonfirmasi', expect.anything());
  });

  it('pembatalan yang kalah balapan dilaporkan sudah-diproses', async () => {
    const deps = siapkan({ statusApi: { transactionStatus: 'expire', statusCode: '407' } });
    deps.batalkanOtomatis = vi.fn(async () => false);
    const hasil = await tanganiNotifikasiMidtrans(notifikasi({ transaction_status: 'expire', status_code: '407' }), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'sudah-diproses' });
  });

  it('status Midtrans yang tidak dikenal dicatat level error agar terpantau', async () => {
    const deps = siapkan({ statusApi: { transactionStatus: 'status_baru_midtrans' } });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil.hasil).toBe('diabaikan');
    expect(deps.catat).toHaveBeenCalledWith('error', expect.stringContaining('status_baru_midtrans'), expect.anything());
  });

  it('uang masuk untuk pesanan yang sudah dibatalkan ditandai untuk admin', async () => {
    const deps = siapkan({
      pesanan: {
        nomorPesanan: 'INV-202609-0001',
        status: 'cancelled',
        paymentStatus: 'unpaid',
        metodeBayar: 'bank_bca',
        grandTotal: 324_300,
        idTransaksiAktif: 'INV-202609-0001',
      },
    });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'perlu-tindakan-admin' });
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
    expect(deps.catat).toHaveBeenCalledWith('error', expect.stringContaining('dibatalkan'), expect.anything());
  });

  it('transaksi kedaluwarsa membatalkan pesanan pending', async () => {
    const deps = siapkan({ statusApi: { transactionStatus: 'expire', statusCode: '407' } });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi({ transaction_status: 'expire', status_code: '407' }), deps);

    expect(hasil).toEqual({ httpStatus: 200, hasil: 'dibatalkan' });
    expect(deps.batalkanOtomatis).toHaveBeenCalledWith('INV-202609-0001', 'Batas waktu pembayaran habis', 'INV-202609-0001');
  });

  it('kedaluwarsanya percobaan lama tidak membatalkan pesanan yang sedang dibayar ulang', async () => {
    const deps = siapkan({
      pesanan: {
        nomorPesanan: 'INV-202609-0001',
        status: 'pending',
        paymentStatus: 'unpaid',
        metodeBayar: 'bank_bca',
        grandTotal: 324_300,
        idTransaksiAktif: 'INV-202609-0001~2',
      },
      statusApi: { transactionStatus: 'expire', statusCode: '407' },
    });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi({ transaction_status: 'expire', status_code: '407' }), deps);

    expect(hasil.hasil).toBe('diabaikan');
    expect(deps.batalkanOtomatis).not.toHaveBeenCalled();
  });

  it('pembayaran lewat percobaan kedua tetap mengonfirmasi pesanan', async () => {
    const deps = siapkan();
    const n = notifikasi({ order_id: 'INV-202609-0001~2' });
    const hasil = await tanganiNotifikasiMidtrans(n, deps);

    expect(deps.cariPesanan).toHaveBeenCalledWith('INV-202609-0001');
    expect(deps.ambilStatus).toHaveBeenCalledWith('INV-202609-0001~2');
    expect(hasil.hasil).toBe('dikonfirmasi');
  });

  it('pesanan COD tidak pernah diubah oleh notifikasi gateway', async () => {
    const deps = siapkan({
      pesanan: {
        nomorPesanan: 'INV-202609-0001',
        status: 'confirmed',
        paymentStatus: 'unpaid',
        metodeBayar: 'cod',
        grandTotal: 324_300,
        idTransaksiAktif: null,
      },
    });
    const hasil = await tanganiNotifikasiMidtrans(notifikasi(), deps);

    expect(hasil.hasil).toBe('ditolak');
    expect(deps.konfirmasiBayar).not.toHaveBeenCalled();
  });

  it('galat saat menyimpan dijawab 500 agar dikirim ulang', async () => {
    const deps = siapkan();
    deps.konfirmasiBayar = vi.fn(async () => {
      throw new Error('koneksi DB putus');
    });
    expect(await tanganiNotifikasiMidtrans(notifikasi(), deps)).toEqual({ httpStatus: 500, hasil: 'galat' });
  });
});
