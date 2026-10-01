import Link from 'next/link';
import { Store, ShieldCheck, Truck } from 'lucide-react';
export default function Footer() {
  return <footer className="mt-auto border-t bg-muted/40 pb-20 md:pb-0"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
    <div><Link href="/" className="flex items-center gap-2 text-xl font-bold"><Store className="text-orange-600" />TokoKita</Link><p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">Pilihan produk untuk kebutuhan harian Anda. Belanja nyaman, harga transparan.</p></div>
    <div><h2 className="text-base font-semibold">Bantuan & Informasi</h2><nav aria-label="Informasi" className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground"><Link href="/bantuan">Pusat Bantuan</Link><Link href="/kebijakan-privasi">Kebijakan Privasi</Link><Link href="/syarat-ketentuan">Syarat & Ketentuan</Link></nav></div>
    <div><h2 className="text-base font-semibold">Belanja dengan Tenang</h2><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-5" />Pembayaran aman</p><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Truck className="size-5" />Pilihan kurir terpercaya</p><p className="mt-3 text-sm text-muted-foreground">Harga sudah termasuk PPN 11%.</p></div>
  </div><div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} TokoKita. Semua hak dilindungi.</div></footer>;
}
