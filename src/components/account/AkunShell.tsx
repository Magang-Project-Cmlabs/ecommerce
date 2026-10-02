"use client";

// Komponen Shell Halaman Akun Pengguna (PRD §5).
// Menyediakan navigasi 4 Tab: Ubah Profil, Ganti Password, Kelola Alamat, Hapus Akun.

import { useState } from "react";
import Link from "next/link";
import { User, Lock, MapPin, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import ProfilTab from "./ProfilTab";
import PasswordTab from "./PasswordTab";
import AlamatTab from "./AlamatTab";
import HapusAkunTab from "./HapusAkunTab";
import type { Alamat } from "@/lib/data/alamat";

type Props = {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: "customer" | "admin";
  };
  initialAddresses: Alamat[];
};

type TabType = "profil" | "password" | "alamat" | "hapus";

export default function AkunShell({ user, initialAddresses }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("profil");

  const tabs: {
    id: TabType;
    label: string;
    icon: typeof User;
    danger?: boolean;
  }[] = [
    { id: "profil", label: "Ubah Profil", icon: User },
    { id: "password", label: "Ganti Password", icon: Lock },
    { id: "alamat", label: "Kelola Alamat", icon: MapPin },
    { id: "hapus", label: "Hapus Akun", icon: Trash2, danger: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Sidebar Navigasi Tab */}
      <aside className="lg:col-span-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          {/* Info Singkat Profil Pengguna */}
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-black text-orange-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* List Tab Navigasi */}
          <nav className="mt-4 flex flex-col gap-1.5" aria-label="Menu Akun">
            <Link
              href="/akun/pesanan"
              className="flex w-full items-center justify-between rounded-xl bg-orange-50/60 px-4 py-3 text-xs font-bold text-orange-700 transition-all hover:bg-orange-100/70"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4 shrink-0 text-orange-700" />
                <span>Riwayat Pesanan Saya</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="my-1.5 border-t border-gray-100" />
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition-all text-left ${
                    isActive
                      ? tab.danger
                        ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                        : "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                      : tab.danger
                      ? "text-gray-500 hover:bg-red-50/50 hover:text-red-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? tab.danger
                          ? "text-red-600"
                          : "text-orange-700"
                        : "text-gray-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Konten Tab Aktif */}
      <main className="lg:col-span-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
          {activeTab === "profil" && <ProfilTab user={user} />}
          {activeTab === "password" && <PasswordTab />}
          {activeTab === "alamat" && (
            <AlamatTab initialAddresses={initialAddresses} />
          )}
          {activeTab === "hapus" && <HapusAkunTab />}
        </div>
      </main>
    </div>
  );
}
