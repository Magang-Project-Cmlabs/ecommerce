import Link from "next/link";
import { Search, Filter, TrendingUp, AlertTriangle } from "lucide-react";

const recentOrders = [
  { id: "#TK1094", customer: "Andi Pratama", total: "Rp 125.000", status: "Dikemas", color: "bg-orange-100 text-orange-700" },
  { id: "#TK1093", customer: "Budi Santoso", total: "Rp 450.000", status: "Menunggu Bayar", color: "bg-amber-100 text-amber-700" },
  { id: "#TK1092", customer: "Citra Dewi", total: "Rp 210.500", status: "Dikirim", color: "bg-emerald-100 text-emerald-700" },
  { id: "#TK1091", customer: "Dian Sari", total: "Rp 330.000", status: "Dikemas", color: "bg-orange-100 text-orange-700" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pesanan Hari Ini</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">18 Pesanan</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +12%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Omzet Bulan Ini</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">Rp 45.200.000</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +8.4%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pesanan Perlu Diproses</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600">5</span>
            <span className="text-xs text-slate-500">butuh resi/kirim</span>
          </div>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-300 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Peringatan Stok Menipis
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-900">3 Produk</span>
            <span className="text-xs font-medium text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">sisa ≤ 5</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Daftar Pesanan Terbaru</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Cari pesanan / nama..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nomor Pesanan</th>
                <th className="px-6 py-4">Pembeli</th>
                <th className="px-6 py-4">Total Belanja</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{order.id}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${order.color}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/orders/${order.id.replace('#', '')}`}
                      className="inline-block px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
