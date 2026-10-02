import { CreditCard, PackageCheck, ReceiptText, Truck } from 'lucide-react';

const kata = ['Belanja nyaman', 'Harga transparan', 'Bayar aman', 'Ongkir sesuai berat'];

/** Pita teks besar yang bergeser pelan (dekoratif; isinya juga ada di baris jaminan di bawahnya). */
export function TeksBerjalan() {
  const baris = <div className="flex shrink-0 items-center">{kata.map((k) => <span key={k} className="flex items-center whitespace-nowrap px-6 md:px-10">{k}<span className="ml-12 text-sale md:ml-20">✱</span></span>)}</div>;
  return <div aria-hidden className="-mx-4 mt-24 overflow-hidden border-y border-border py-6 md:-mx-6 md:mt-36 md:py-9">
    <div className="teks-jalan flex w-max font-heading text-5xl font-medium tracking-[-0.045em] md:text-8xl">{baris}{baris}</div>
  </div>;
}

const jaminan = [
  { ikon: CreditCard, judul: 'Pembayaran aman', isi: 'QRIS, transfer bank BCA atau Mandiri lewat Midtrans, atau bayar di tempat.' },
  { ikon: ReceiptText, judul: 'Harga sudah termasuk PPN', isi: 'Tidak ada biaya tersembunyi. Ongkir dihitung dari berat barang.' },
  { ikon: Truck, judul: 'Kurir pilihan', isi: 'Pilih layanan kurir dan lihat perkiraan ongkir sebelum membayar.' },
  { ikon: PackageCheck, judul: 'Pantau pesanan', isi: 'Status dan nomor resi tersedia di halaman Pesanan Saya.' },
];

export function JaminanToko() {
  return <section aria-label="Belanja dengan tenang" className="grid gap-x-8 gap-y-10 pt-16 sm:grid-cols-2 md:pt-20 lg:grid-cols-4">
    {jaminan.map(({ ikon: Ikon, judul, isi }) => <div key={judul}>
      <span className="flex size-11 items-center justify-center rounded-full bg-tile"><Ikon aria-hidden className="size-5" strokeWidth={1.6} /></span>
      <h3 className="mt-4 text-lg font-medium">{judul}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{isi}</p>
    </div>)}
  </section>;
}
