// Uji integrasi ke Midtrans SANDBOX sungguhan (butuh jaringan + Server Key).
//
// Hanya jalan lewat `npm run test:sandbox`; di `npm run test` biasa dilewati.
// Dua tahap, karena pembayarannya harus dilakukan manusia di halaman Snap:
//
//   npm run test:sandbox -- -t buat   -> membuat sesi bayar, mencetak link Snap
//   (buka link, pilih BCA Virtual Account, bayar di simulator sandbox)
//   npm run test:sandbox -- -t cek    -> status dari Midtrans + handler webhook
//
// Server Key dibaca dari .env dan tidak pernah dicetak.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { bacaKonfigMidtrans, buatKlienMidtrans, type KlienMidtrans, type KonfigMidtrans } from './midtrans';
import { tanganiNotifikasiMidtrans, type DepsNotifikasi, type PesananTersimpan } from './notifikasi';
import type { PesananUntukBayar } from './types';

const AKTIF = process.env.npm_lifecycle_event === 'test:sandbox';
const BERKAS_STATE = path.resolve('.sandbox', 'terakhir.json');

type State = { idTransaksi: string; grandTotal: number; urlBayar: string; dibuat: string };

describe.skipIf(!AKTIF)('Midtrans sandbox (sungguhan)', () => {
  let konfig: KonfigMidtrans;
  let klien: KlienMidtrans;

  beforeAll(() => {
    if (fs.existsSync('.env')) process.loadEnvFile('.env');
    konfig = bacaKonfigMidtrans(); // gagal jelas bila MIDTRANS_SERVER_KEY kosong
    expect(konfig.isProduction, 'uji ini hanya untuk sandbox').toBe(false);
    klien = buatKlienMidtrans(konfig);
  });

  it('buat: sesi Snap dibuat untuk pesanan uji (dengan ongkir dan diskon)', async () => {
    const sekarang = new Date();
    const nomor = `UJI-${sekarang.getTime()}`;
    const pesanan: PesananUntukBayar = {
      nomorPesanan: nomor,
      percobaan: 1,
      metode: 'bank_bca',
      items: [
        { id: 'var-uji-1', nama: 'Kaos Polos Premium - M (uji)', harga: 89_000, jumlah: 2 },
        { id: 'prd-uji-2', nama: 'Celana Chino (uji)', harga: 149_000, jumlah: 1 },
      ],
      ongkir: 30_000,
      diskon: 32_700,
      grandTotal: 89_000 * 2 + 149_000 + 30_000 - 32_700,
      dibuatPada: sekarang,
      batasBayar: new Date(sekarang.getTime() + 60 * 60 * 1000),
      pelanggan: { nama: 'Pembeli Uji', email: 'pembeli.uji@example.com', telepon: '081234567890' },
      urlSelesai: 'http://localhost:3000/akun/pesanan/' + nomor,
    };

    const sesi = await klien.buatSesi(pesanan, sekarang);

    expect(sesi.idTransaksi).toBe(nomor);
    expect(sesi.token.length).toBeGreaterThan(10);
    expect(sesi.urlBayar).toMatch(/^https:\/\/app\.sandbox\.midtrans\.com\//);

    const state: State = { idTransaksi: nomor, grandTotal: pesanan.grandTotal, urlBayar: sesi.urlBayar, dibuat: sekarang.toISOString() };
    fs.mkdirSync(path.dirname(BERKAS_STATE), { recursive: true });
    fs.writeFileSync(BERKAS_STATE, JSON.stringify(state, null, 2));

    console.log(`\nSesi bayar dibuat untuk ${nomor} (Rp ${pesanan.grandTotal.toLocaleString('id-ID')}).`);
    console.log(`Buka link ini, pilih "BCA Virtual Account", catat nomor VA-nya:\n  ${sesi.urlBayar}`);
    console.log('Bayar di: https://simulator.sandbox.midtrans.com/bca/va/index');
    console.log('Lalu jalankan: npm run test:sandbox -- -t cek\n');
  }, 30_000);

  it('cek: status settlement dari Midtrans diproses handler webhook menjadi pesanan dikonfirmasi', async () => {
    expect(fs.existsSync(BERKAS_STATE), 'jalankan tahap "buat" dulu').toBe(true);
    const state = JSON.parse(fs.readFileSync(BERKAS_STATE, 'utf8')) as State;

    // 1. Status langsung dari API Midtrans
    const status = await klien.ambilStatus(state.idTransaksi);
    console.log(`\nStatus Midtrans ${state.idTransaksi}: ${status.transactionStatus} (${status.paymentType ?? '-'}), Rp ${status.jumlah}`);
    expect(status.transactionStatus, 'belum dibayar di simulator?').toBe('settlement');
    expect(status.jumlah).toBe(state.grandTotal);

    // 2. Notifikasi seperti yang dikirim Midtrans, ditandatangani dengan server key
    const gross = `${status.jumlah}.00`;
    const body = {
      order_id: state.idTransaksi,
      status_code: status.statusCode,
      gross_amount: gross,
      transaction_status: status.transactionStatus,
      signature_key: createHash('sha512')
        .update(state.idTransaksi + status.statusCode + gross + konfig.serverKey)
        .digest('hex'),
    };

    // 3. Pesanan tiruan di memori menggantikan database
    let pesanan: PesananTersimpan = {
      nomorPesanan: state.idTransaksi,
      status: 'pending',
      paymentStatus: 'unpaid',
      metodeBayar: 'bank_bca',
      grandTotal: state.grandTotal,
      idTransaksiAktif: state.idTransaksi,
    };
    let jumlahKonfirmasi = 0;
    const deps: DepsNotifikasi = {
      serverKey: konfig.serverKey,
      cariPesanan: async () => pesanan,
      ambilStatus: (id) => klien.ambilStatus(id), // API Midtrans sungguhan
      konfirmasiBayar: async () => {
        jumlahKonfirmasi++;
        pesanan = { ...pesanan, status: 'confirmed', paymentStatus: 'paid' };
        return true;
      },
      batalkanOtomatis: async () => {
        throw new Error('tidak boleh dibatalkan');
      },
      catat: () => {},
    };

    const pertama = await tanganiNotifikasiMidtrans(body, deps);
    const kedua = await tanganiNotifikasiMidtrans(body, deps);
    const palsu = await tanganiNotifikasiMidtrans({ ...body, signature_key: 'ab'.repeat(64) }, deps);

    console.log(`Notifikasi pertama : ${pertama.httpStatus} ${pertama.hasil}`);
    console.log(`Notifikasi ulang   : ${kedua.httpStatus} ${kedua.hasil}`);
    console.log(`Signature palsu    : ${palsu.httpStatus} ${palsu.hasil}\n`);

    expect(pertama).toEqual({ httpStatus: 200, hasil: 'dikonfirmasi' });
    expect(kedua).toEqual({ httpStatus: 200, hasil: 'sudah-diproses' });
    expect(palsu.httpStatus).toBe(401);
    expect(jumlahKonfirmasi).toBe(1);
    expect(pesanan).toMatchObject({ status: 'confirmed', paymentStatus: 'paid' });
  }, 30_000);
});
