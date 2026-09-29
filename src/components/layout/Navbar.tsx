import Link from "next/link";
import { Search, ScanBarcode, ShoppingCart, User, LogOut } from "lucide-react";
import { keluar } from "@/actions/auth";
import { ambilPenggunaSaatIni } from "@/lib/data/pengguna";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="#FF6B00" aria-hidden>
        <path d="M4 26c10-2 18-8 24-20 6 6 8 14 4 22-4-2-8-2-12 0 4 2 6 6 6 10-8-6-16-8-22-12z" />
      </svg>
      <span className="text-[32px] font-extrabold leading-none tracking-tight">
        Toko<span className="text-[#FF6B00]">Kita</span>
      </span>
    </Link>
  );
}

export default async function Navbar() {
  const pengguna = await ambilPenggunaSaatIni();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-[78px] w-full max-w-[1680px] items-center gap-10 px-6">
        <Logo />

        <div className="flex h-[46px] flex-1 items-center overflow-hidden rounded-full bg-[#F1F1F1]">
          <Search className="ml-4 h-5 w-5 text-gray-600" />
          <input
            type="text"
            placeholder="Cari produk, merek..."
            className="h-full flex-1 bg-transparent px-4 text-[15px] outline-none placeholder:text-gray-500"
          />
          <button
            type="button"
            aria-label="Scan"
            className="flex h-full w-[72px] items-center justify-center bg-[#FF6B00] text-white hover:bg-[#e85f00]"
          >
            <ScanBarcode className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center gap-8 pr-6">
          <Link href="/checkout" aria-label="Keranjang" className="relative">
            <ShoppingCart className="h-8 w-8" strokeWidth={1.5} />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
              3
            </span>
          </Link>

          <Link
            href={pengguna ? "/akun" : "/masuk"}
            aria-label={pengguna ? `Akun ${pengguna.name}` : "Masuk"}
            title={pengguna ? pengguna.name : "Masuk"}
          >
            <User className="h-8 w-8" strokeWidth={1.5} />
          </Link>

          {pengguna && (
            <form action={keluar}>
              <button
                type="submit"
                aria-label="Keluar"
                title="Keluar"
                className="text-gray-600 hover:text-[#FF6B00]"
              >
                <LogOut className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
