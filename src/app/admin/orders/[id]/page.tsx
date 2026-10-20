import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from "lucide-react";

interface OrderDetailView {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: "MENUNGGU_BAYAR" | "DIKEMAS" | "DIKIRIM" | "SELESAI" | "DIBATALKAN";
  paymentMethod: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  shippingCourier: string;
  shippingService: string;
  trackingNumber?: string;
  cancelReason?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    recipientName: string;
    phone: string;
    fullAddress: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    productTitle: string;
    variantName: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
    imageUrl: string;
  }>;
  pricing: {
    subtotal: number;
    shippingCost: number;
    discountAmount: number;
    totalAmount: number;
  };
}

async function getOrderData(orderNumber: string): Promise<OrderDetailView | null> {
  const mockOrders: Record<string, OrderDetailView> = {
    "TK-20260928-001": {
      id: "ord_1",
      orderNumber: "TK-20260928-001",
      createdAt: "28 September 2026, 09:15 WIB",
      status: "DIKEMAS",
      paymentMethod: "BCA Virtual Account (Midtrans)",
      paymentStatus: "PAID",
      shippingCourier: "JNE",
      shippingService: "REG (Reguler 2-3 Hari)",
      customer: {
        name: "Andi Pratama",
        email: "andi.pratama@example.com",
        phone: "081234567890",
      },
      shippingAddress: {
        recipientName: "Andi Pratama",
        phone: "081234567890",
        fullAddress: "Jl. Margonda Raya No. 45, RT 02 / RW 07, Kemiri Muka, Beji",
        city: "Kota Depok, Jawa Barat",
        postalCode: "16423",
      },
      items: [
        {
          id: "item_1",
          productTitle: "Kaos Polos Cotton Combed 30s Premium",
          variantName: "Hitam / L",
          sku: "TSH-BLK-L",
          price: 62500,
          quantity: 2,
          subtotal: 125000,
          imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150&auto=format&fit=crop&q=80",
        },
      ],
      pricing: {
        subtotal: 125000,
        shippingCost: 15000,
        discountAmount: 15000,
        totalAmount: 125000,
      },
    },
    "TK-20260927-089": {
      id: "ord_3",
      orderNumber: "TK-20260927-089",
      createdAt: "27 September 2026, 16:20 WIB",
      status: "DIKIRIM",
      paymentMethod: "QRIS GoPay",
      paymentStatus: "PAID",
      shippingCourier: "JNE",
      shippingService: "REG",
      trackingNumber: "JNE88291039941",
      customer: {
        name: "Citra Dewi",
        email: "citra.dewi@example.com",
        phone: "085678901234",
      },
      shippingAddress: {
        recipientName: "Citra Dewi",
        phone: "085678901234",
        fullAddress: "Jl. Pajajaran No. 12, Baranangsiang, Bogor Timur",
        city: "Kota Bogor, Jawa Barat",
        postalCode: "16143",
      },
      items: [
        {
          id: "item_3",
          productTitle: "Sepatu Sneakers Classic Canvas",
          variantName: "Putih / 39",
          sku: "SNK-WHT-39",
          price: 195500,
          quantity: 1,
          subtotal: 195500,
          imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=150&auto=format&fit=crop&q=80",
        },
      ],
      pricing: {
        subtotal: 195500,
        shippingCost: 15000,
        discountAmount: 0,
        totalAmount: 210500,
      },
    },
  };

  return mockOrders[orderNumber] || {
    id: `ord_${orderNumber}`,
    orderNumber: orderNumber,
    createdAt: "28 September 2026, 10:00 WIB",
    status: "DIKEMAS",
    paymentMethod: "BCA Virtual Account",
    paymentStatus: "PAID",
    shippingCourier: "J&T Express",
    shippingService: "EZ",
    customer: {
      name: "Pelanggan TokoKita",
      email: "customer@example.com",
      phone: "081299998888",
    },
    shippingAddress: {
      recipientName: "Pelanggan TokoKita",
      phone: "081299998888",
      fullAddress: "Jl. Akses UI No. 100, Kelapa Dua",
      city: "Kota Depok, Jawa Barat",
      postalCode: "16451",
    },
    items: [
      {
        id: "item_default",
        productTitle: "Sample Produk Pesanan",
        variantName: "Standard",
        sku: "PROD-SAMPLE-01",
        price: 150000,
        quantity: 1,
        subtotal: 150000,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80",
      },
    ],
    pricing: {
      subtotal: 150000,
      shippingCost: 12000,
      discountAmount: 0,
      totalAmount: 162000,
    },
  };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const decodedId = decodeURIComponent(resolvedParams.id);
  const order = await getOrderData(decodedId);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
    
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Dibuat pada {order.createdAt}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
          >
            Kembali ke Daftar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-600" /> Rincian Produk Belanja
              </h2>
              <span className="text-xs text-slate-500">{order.items.length} Barang</span>
            </div>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4 items-center">
                  <img
                    src={item.imageUrl}
                    alt={item.productTitle}
                    className="w-16 h-16 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {item.productTitle}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Varian: <span className="font-medium text-slate-700">{item.variantName}</span> | SKU: {item.sku}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Rp {item.price.toLocaleString("id-ID")} x {item.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 text-right">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <FileText className="w-4 h-4 text-orange-600" /> Rincian Pembayaran
            </h2>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span className="font-medium text-slate-900">
                  Rp {order.pricing.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Pengiriman</span>
                <span className="font-medium text-slate-900">
                  Rp {order.pricing.shippingCost.toLocaleString("id-ID")}
                </span>
              </div>
              {order.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Promo / Voucher</span>
                  <span>- Rp {order.pricing.discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-base font-bold text-slate-900">
                <span>Total Belanja</span>
                <span className="text-orange-600">
                  Rp {order.pricing.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
         
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <Truck className="w-4 h-4 text-orange-600" /> Informasi Pengiriman
            </h2>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Ekspedisi:</span>
                <p className="font-semibold text-slate-800">{order.shippingCourier} ({order.shippingService})</p>
              </div>
              <div>
                <span className="text-slate-400">Nomor Resi:</span>
                <p className="font-mono font-semibold text-slate-900">
                  {order.trackingNumber || <span className="text-amber-600 italic font-sans">Belum ada nomor resi</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <MapPin className="w-4 h-4 text-orange-600" /> Alamat Tujuan
            </h2>
            <div className="text-xs space-y-1 text-slate-600">
              <p className="font-semibold text-slate-900 text-sm">{order.shippingAddress.recipientName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p className="mt-1 leading-relaxed text-slate-700">{order.shippingAddress.fullAddress}</p>
              <p>{order.shippingAddress.city} - {order.shippingAddress.postalCode}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <CreditCard className="w-4 h-4 text-orange-600" /> Metode Pembayaran
            </h2>
            <div className="text-xs space-y-1.5">
              <p className="font-medium text-slate-800">{order.paymentMethod}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Status Bayar:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
