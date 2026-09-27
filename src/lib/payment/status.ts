// Pemetaan status transaksi Midtrans ke aksi pesanan TokoKita.
// Sumber: https://docs.midtrans.com/docs/transaction-status-cycle
//
// Fungsi murni: tidak menyentuh database. Syarat lain (jumlah cocok, status
// pesanan saat ini, percobaan aktif) diperiksa di notifikasi.ts.

import type { AksiPesanan, StatusGateway } from './types';

export function tentukanAksi(s: StatusGateway): AksiPesanan {
  const fraud = s.fraudStatus?.toLowerCase();

  switch (s.transactionStatus) {
    case 'settlement':
      // Dana diterima. Midtrans: sukses = status_code 200 + settlement/capture
      // + fraud accept (fraud_status tidak selalu dikirim untuk non-kartu).
      if (s.statusCode !== '200') return { jenis: 'abaikan', alasan: `settlement dengan status_code ${s.statusCode}` };
      if (fraud && fraud !== 'accept') return { jenis: 'abaikan', alasan: `fraud_status ${fraud}` };
      return { jenis: 'konfirmasi', paymentType: s.paymentType };

    case 'capture':
      // Khusus kartu: hanya lunas bila lolos pemeriksaan fraud.
      if (s.statusCode === '200' && fraud === 'accept') return { jenis: 'konfirmasi', paymentType: s.paymentType };
      return { jenis: 'abaikan', alasan: `capture menunggu/ditolak review fraud (${fraud ?? 'tanpa fraud_status'})` };

    case 'expire':
      return { jenis: 'batalkan', alasan: 'Batas waktu pembayaran habis' };

    case 'pending':
    case 'authorize':
      return { jenis: 'abaikan', alasan: 'menunggu pembayaran' };

    case 'deny':
    case 'cancel':
    case 'failure':
      // Pesanan tetap pending sampai batas bayar; pembeli boleh mencoba lagi
      // dengan percobaan baru (lihat idTransaksiGateway).
      return { jenis: 'abaikan', alasan: `pembayaran gagal (${s.transactionStatus}), pembeli dapat mencoba lagi` };

    case 'refund':
    case 'partial_refund':
    case 'chargeback':
    case 'partial_chargeback':
      return { jenis: 'abaikan', alasan: `${s.transactionStatus} ditangani manual oleh admin` };

    default:
      // 200 menghentikan pengiriman ulang Midtrans, jadi status baru yang
      // mungkin berarti "lunas" harus terlihat di log, bukan hilang diam-diam.
      return { jenis: 'abaikan', alasan: `status tidak dikenal: ${s.transactionStatus}`, perluDiperiksa: true };
  }
}
