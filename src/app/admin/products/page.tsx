import { Search, Filter, AlertTriangle } from "lucide-react";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
   
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Produk & Stok</h1>
          <p className="text-sm text-slate-500">Pantau ketersediaan stok fisik gudang dan kelola varian barang.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
        <span className="text-sm font-medium">Ada 3 varian produk dengan stok kritis (&le; 5 unit)</span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg">Semua Produk (6)</button>
          <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Stok Menipis &le; 5 (3)</button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari judul produk, SKU, atau varian..." 
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 font-semibold">Produk & Varian</th>
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 font-semibold">SKU</th>
              <th className="p-4 font-semibold">Harga</th>
              <th className="p-4 font-semibold">Status & Kuantitas Stok</th>
              <th className="p-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg shrink-0"></div>
                <div>
                  <p className="font-semibold text-slate-900">Kaos Polos Oversize</p>
                  <p className="text-xs text-slate-500">Varian: Hitam - L</p>
                </div>
              </td>
              <td className="p-4">Pakaian Pria</td>
              <td className="p-4 font-mono text-xs">TSH-BLK-L</td>
              <td className="p-4 font-medium">Rp 62.500</td>
              <td className="p-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  3 Unit (Menipis)
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100">Lihat Detail</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}