import Link from 'next/link';

const kolom = [
  { judul: 'Belanja', label: 'Tautan belanja', tautan: [{ href: '/produk', label: 'Semua produk' }, { href: '/produk?promo=1', label: 'Promo' }, { href: '/produk?urut=terbaru', label: 'Produk terbaru' }, { href: '/wishlist', label: 'Wishlist' }] },
  { judul: 'Akun', label: 'Tautan pelanggan', tautan: [{ href: '/akun', label: 'Akun saya' }, { href: '/akun/pesanan', label: 'Pesanan saya' }, { href: '/masuk', label: 'Masuk' }, { href: '/daftar', label: 'Daftar' }] },
  { judul: 'Bantuan', label: 'Informasi', tautan: [{ href: '/bantuan', label: 'Pusat bantuan' }, { href: '/kebijakan-privasi', label: 'Kebijakan privasi' }, { href: '/syarat-ketentuan', label: 'Syarat & ketentuan' }] },
];

// Footer gelap di kedua mode (seperti template acuan): kolom tautan + merek besar di bawah.
export default function Footer() {
  return <footer className="mt-24 bg-[#0a0a0a] pb-20 text-white md:mt-32 md:pb-0 dark:border-t dark:border-white/10">
    <div className="mx-auto max-w-[1400px] px-4 pt-16 md:px-6 md:pt-20">
      <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-heading text-2xl font-medium tracking-[-0.03em]">Belanja yang terasa ringan.</p>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/65">Pilihan produk harian dengan harga transparan, pembayaran aman, dan pesanan yang mudah dipantau.</p>
        </div>
        {kolom.map((k) => <nav key={k.judul} aria-label={k.label}>
          <h2 className="text-sm font-medium text-white/50">{k.judul}</h2>
          <ul className="mt-4 space-y-1">{k.tautan.map((t) => <li key={t.href}><Link href={t.href} className="inline-flex min-h-9 items-center text-[15px] text-white/85 transition-colors hover:text-white">{t.label}</Link></li>)}</ul>
        </nav>)}
      </div>
      <p aria-hidden className="mt-16 select-none font-heading text-[23vw] font-semibold leading-[0.78] tracking-[-0.07em] text-white md:mt-20 md:text-[19vw] min-[1400px]:text-[266px]">TokoKita<span className="text-sale">.</span></p>
      <div className="flex flex-col gap-2 border-t border-white/15 py-6 text-[13px] text-white/55 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} TokoKita. Semua hak dilindungi.</p>
        <p>Harga sudah termasuk PPN 11%.</p>
      </div>
    </div>
  </footer>;
}
