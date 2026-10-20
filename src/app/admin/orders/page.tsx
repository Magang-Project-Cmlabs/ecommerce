"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Truck, 
  XCircle, 
  CheckCircle, 
  Clock, 
  PackageCheck,
  ChevronRight,
  X
} from "lucide-react";

type OrderStatus = "SEMUA" | "MENUNGGU_BAYAR" | "DIKEMAS" | "DIKIRIM" | "SELESAI" | "DIBATALKAN";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  itemsSummary: string;
  totalAmount: number;
  status: OrderStatus;
  date: string;
  courier?: string;
  trackingNumber?: string;
  cancelReason?: string;
}

const initialOrders: Order[] = [
  {
    id: "1",
    orderNumber: "TK-20260928-001",
    customerName: "Andi Pratama",
    itemsSummary: "Kaos Polos Cotton Combed (L) x 2",
    totalAmount: 125000,
    status: "DIKEMAS",
    date: "28 Sep 2026, 09:15",
  },
  {
    id: "2",
    orderNumber: "TK-20260928-002",
    customerName: "Budi Santoso",
    itemsSummary: "Kemeja Flanel Slim Fit (XL) x 1",
    totalAmount: 450000,
    status: "MENUNGGU_BAYAR",
    date: "28 Sep 2026, 08:40",
  },
  {
    id: "3",
    orderNumber: "TK-20260927-089",
    customerName: "Citra Dewi",
    itemsSummary: "Sepatu Sneakers Classic (39) x 1",
    totalAmount: 210500,
    status: "DIKIRIM",
    courier: "JNE Reguler",
    trackingNumber: "JNE88291039941",
    date: "27 Sep 2026, 16:20",
  },
  {
    id: "4",
    orderNumber: "TK-20260927-080",
    customerName: "Dian Sari",
    itemsSummary: "Tas Ransel Kanvas (Black) x 1",
    totalAmount: 330000,
    status: "DIKEMAS",
    date: "27 Sep 2026, 14:10",
  },
  {
    id: "5",
    orderNumber: "TK-20260926-045",
    customerName: "Eko Prasetyo",
    itemsSummary: "Celana Chino Slim Fit (32) x 1",
    totalAmount: 195000,
    status: "SELESAI",
    courier: "J&T Express",
    trackingNumber: "JT7710928341",
    date: "26 Sep 2026, 11:05",
  },
  {
    id: "6",
    orderNumber: "TK-20260926-030",
    customerName: "Fina Melati",
    itemsSummary: "Jaket Bomber Parasut (M) x 1",
    totalAmount: 275000,
    status: "DIBATALKAN",
    cancelReason: "Stok ukuran M habis di gudang",
    date: "26 Sep 2026, 09:30",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedTab, setSelectedTab] = useState<OrderStatus>("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");

  const [shippingModalOrder, setShippingModalOrder] = useState<Order | null>(null);
  const [courier, setCourier] = useState("JNE");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesTab = selectedTab === "SEMUA" || order.status === selectedTab;
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleConfirmShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingModalOrder || !trackingNumber.trim()) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === shippingModalOrder.id
          ? { ...o, status: "DIKIRIM", courier, trackingNumber }
          : o
      )
    );
    setShippingModalOrder(null);
    setTrackingNumber("");
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelReason.trim()) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelModalOrder.id
          ? { ...o, status: "DIBATALKAN", cancelReason }
          : o
      )
    );
    setCancelModalOrder(null);
    setCancelReason("");
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "MENUNGGU_BAYAR":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Menunggu Bayar</span>;
      case "DIKEMAS":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800"><PackageCheck className="w-3 h-3" /> Dikemas</span>;
      case "DIKIRIM":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Truck className="w-3 h-3" /> Dikirim</span>;
      case "SELESAI":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3" /> Selesai</span>;
      case "DIBATALKAN":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Dibatalkan</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
    
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pesanan</h1>
          <p className="text-sm text-slate-500">Kelola konfirmasi pengiriman, nomor resi kurir, dan pembatalan pesanan.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 pb-px">
        {[
          { key: "SEMUA", label: "Semua" },
          { key: "MENUNGGU_BAYAR", label: "Menunggu Bayar" },
          { key: "DIKEMAS", label: "Perlu Dikirim (Dikemas)" },
          { key: "DIKIRIM", label: "Dalam Pengiriman" },
          { key: "SELESAI", label: "Selesai" },
          { key: "DIBATALKAN", label: "Dibatalkan" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as OrderStatus)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              selectedTab === tab.key
                ? "border-orange-500 text-orange-600 font-semibold"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari berdasarkan nomor pesanan atau nama pembeli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>
        <span className="text-xs text-slate-500">Menampilkan {filteredOrders.length} pesanan</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nomor & Tanggal</th>
                <th className="px-6 py-4">Pembeli & Barang</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status & Resi</th>
                <th className="px-6 py-4 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada pesanan pada status ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">{order.orderNumber}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{order.date}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-slate-800">{order.customerName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{order.itemsSummary}</div>
                    </td>
                    <td className="px-6 py-4 align-top font-semibold text-slate-900">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 align-top space-y-1.5">
                      <div>{getStatusBadge(order.status)}</div>
                      {order.trackingNumber && (
                        <div className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded inline-block">
                          {order.courier}: {order.trackingNumber}
                        </div>
                      )}
                      {order.cancelReason && (
                        <div className="text-xs text-rose-600 italic">
                          Alasan: {order.cancelReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-right space-x-2 whitespace-nowrap">
                      {order.status === "DIKEMAS" && (
                        <>
                          <button
                            onClick={() => setShippingModalOrder(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition"
                          >
                            <Truck className="w-3.5 h-3.5" /> Input Resi
                          </button>
                          <button
                            onClick={() => setCancelModalOrder(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition"
                          >
                            Batalkan
                          </button>
                        </>
                      )}

                      {order.status === "MENUNGGU_BAYAR" && (
                        <button
                          onClick={() => setCancelModalOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition"
                        >
                          Batalkan
                        </button>
                      )}

                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg transition"
                      >
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" /> Input Nomor Resi Pengiriman
              </h3>
              <button 
                onClick={() => setShippingModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmShipping} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500">Nomor Pesanan</span>
                <p className="font-semibold text-slate-800">{shippingModalOrder.orderNumber}</p>
                <p className="text-xs text-slate-600">Penerima: {shippingModalOrder.customerName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Jasa Ekspedisi / Kurir
                </label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="JNE Express">JNE Express</option>
                  <option value="J&T Express">J&T Express</option>
                  <option value="SiCepat Reguler">SiCepat Reguler</option>
                  <option value="Anteraja">Anteraja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Resi (Tracking Number)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: JNE12903849102"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShippingModalOrder(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition"
                >
                  Konfirmasi Pengiriman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" /> Batalkan Pesanan
              </h3>
              <button 
                onClick={() => setCancelModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500">Nomor Pesanan</span>
                <p className="font-semibold text-slate-800">{cancelModalOrder.orderNumber}</p>
                <p className="text-xs text-slate-600">Total: Rp {cancelModalOrder.totalAmount.toLocaleString("id-ID")}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Misal: Stok barang habis di gudang / Permintaan pembeli..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                >
                  Proses Pembatalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
