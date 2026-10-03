import 'server-only';
import { after } from 'next/server';
import { kirimNotifikasiPesanan } from './notifikasi';

/**
 * Email pesanan dikirim setelah respons selesai, jadi pembeli, admin, webhook,
 * dan cron tidak menunggu SMTP (Gmail bisa beberapa detik). Di luar request
 * Next (tes integrasi, skrip) `after` melempar galat; email langsung dijalankan
 * tanpa ditunggu. kirimNotifikasiPesanan sudah menelan galatnya sendiri.
 */
export function jadwalkanNotifikasiPesanan(id: number): void {
  try {
    after(() => kirimNotifikasiPesanan(id));
  } catch {
    void kirimNotifikasiPesanan(id);
  }
}
