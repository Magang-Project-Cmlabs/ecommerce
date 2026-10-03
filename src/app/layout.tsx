import type { Metadata } from 'next';
import { Albert_Sans, Inter } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SembunyiDiAdmin from '@/components/layout/SembunyiDiAdmin';
import TombolAsisten from '@/components/asisten/TombolAsisten';
import { Toaster } from '@/components/ui/sonner';
import { SKRIP_TEMA } from '@/components/layout/TemaToggle';
import { WishlistProvider } from '@/components/product/WishlistProvider';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { ambilIdWishlist } from '@/lib/data/katalog';
import { urlAplikasi } from '@/lib/url-aplikasi';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const albert = Albert_Sans({ variable: '--font-albert', subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' });
export const metadata: Metadata = {
  metadataBase: new URL(urlAplikasi(process.env)),
  title: { default: 'TokoKita — Belanja Nyaman untuk Kebutuhan Harian', template: '%s — TokoKita' },
  description: 'Temukan produk fashion, elektronik, rumah tangga, kecantikan, dan olahraga pilihan di TokoKita. Harga transparan dan pembayaran aman.',
  openGraph: { locale: 'id_ID', type: 'website', siteName: 'TokoKita' },
};
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const pengguna = await ambilPenggunaSaatIni();
  const ids = pengguna ? await ambilIdWishlist(pengguna.id) : [];
  return <html lang="id" suppressHydrationWarning className={`${inter.variable} ${albert.variable} min-h-full antialiased`}><head><script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} /></head><body className="flex min-h-screen flex-col bg-background font-sans text-foreground"><WishlistProvider key={`${pengguna?.id ?? 'tamu'}`} ids={ids} login={!!pengguna}><SembunyiDiAdmin><Navbar /></SembunyiDiAdmin><div id="konten-utama" className="flex flex-1 flex-col">{children}</div><SembunyiDiAdmin><Footer /><TombolAsisten aktif={process.env.ASISTEN_NONAKTIF !== '1' && !!(process.env.ASISTEN_API_KEY?.trim() || process.env.ASISTEN_CADANGAN_API_KEY?.trim())} /></SembunyiDiAdmin><Toaster position="top-center" richColors closeButton /></WishlistProvider></body></html>;
}
