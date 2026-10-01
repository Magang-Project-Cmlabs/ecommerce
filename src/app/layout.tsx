import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { WishlistProvider } from '@/components/product/WishlistProvider';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { ambilIdWishlist } from '@/lib/data/katalog';
import { urlAplikasi } from '@/lib/url-aplikasi';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
export const metadata: Metadata = {
  metadataBase: new URL(urlAplikasi(process.env)),
  title: { default: 'TokoKita — Belanja Nyaman untuk Kebutuhan Harian', template: '%s — TokoKita' },
  description: 'Temukan produk fashion, elektronik, rumah tangga, kecantikan, dan olahraga pilihan di TokoKita. Harga transparan dan pembayaran aman.',
  openGraph: { locale: 'id_ID', type: 'website', siteName: 'TokoKita' },
};
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const pengguna = await ambilPenggunaSaatIni();
  const ids = pengguna ? await ambilIdWishlist(pengguna.id) : [];
  return <html lang="id" className={`${inter.variable} min-h-full antialiased`}><body className="flex min-h-screen flex-col font-sans"><WishlistProvider key={`${pengguna?.id ?? 'tamu'}`} ids={ids} login={!!pengguna}><Navbar /><div id="konten-utama" className="flex flex-1 flex-col">{children}</div><Footer /><Toaster position="top-center" richColors closeButton /></WishlistProvider></body></html>;
}
