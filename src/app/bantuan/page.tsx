import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Pusat Bantuan' };
export default function Bantuan() {
  const questions = [
    ['Bagaimana cara berbelanja?', 'Pilih produk dan varian, masukkan ke keranjang, lalu klik Checkout. Masuk ke akun, pilih alamat dan kurir, pilih metode pembayaran, kemudian periksa ringkasan sebelum membuat pesanan.'],
    ['Mengapa harga atau stok di keranjang berubah?', 'Keranjang tersimpan di perangkat. Harga dan stok diperiksa ulang dari toko saat checkout agar pesanan memakai data terbaru.'],
    ['Bagaimana membayar pesanan?', 'Buka detail pesanan di akun dan ikuti instruksi pembayaran sebelum batas waktu. Pada lingkungan sandbox, gunakan simulasi pembayaran yang ditampilkan penyedia pembayaran. COD dibayar saat barang diterima.'],
    ['Bagaimana menggunakan kode promo?', 'Masukkan kode pada checkout. Promo harus masih aktif dan memenuhi minimal belanja, kuota, serta batas pemakaian akun.'],
    ['Bagaimana melacak atau membatalkan pesanan?', 'Buka Akun → Pesanan, lalu pilih nomor pesanan. Status, riwayat proses, dan nomor resi tersedia di detail. Pesanan yang belum dibayar dapat dibatalkan dari halaman tersebut.'],
    ['Lupa kata sandi?', 'Pilih Lupa password di halaman masuk. Jika alamat email terdaftar, tautan reset dikirim ke email dan berlaku satu jam untuk satu kali pemakaian.'],
    ['Bagaimana memberi ulasan?', 'Setelah pesanan selesai diterima, pilih Tulis ulasan pada barang di detail pesanan. Anda dapat memberi rating, menulis pengalaman, dan mengunggah hingga tiga foto dalam waktu 30 hari.'],
    ['Bagaimana menghapus akun?', 'Buka halaman profil akun dan pilih Hapus akun. Data profil akan dianonimkan; catatan transaksi tetap disimpan untuk pembukuan.'],
  ];
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10"><h1 className="text-4xl font-medium leading-none md:text-5xl">Pusat Bantuan</h1><p className="mb-7 mt-2 text-muted-foreground">Jawaban untuk pertanyaan seputar belanja di TokoKita.</p><div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="rounded-xl border bg-background p-4"><summary className="cursor-pointer py-1 font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div><div className="mt-7 flex flex-wrap gap-5 text-sm text-foreground"><Link className="underline" href="/akun/pesanan">Lihat pesanan</Link><Link className="underline" href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link><Link className="underline" href="/kebijakan-privasi">Kebijakan Privasi</Link></div></main>;
}
