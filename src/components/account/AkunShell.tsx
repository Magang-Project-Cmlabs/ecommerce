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
        <div className="rounded-3xl bg-tile p-5">
          {/* Info Singkat Profil Pengguna */}
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-black text-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* List Tab Navigasi */}
          <nav className="mt-4 flex flex-col gap-1.5" aria-label="Menu Akun">
            <Link
              href="/akun/pesanan"
              className="flex w-full items-center justify-between rounded-xl bg-muted px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-4 w-4 shrink-0 text-foreground" />
                <span>Riwayat Pesanan Saya</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="my-1.5 border-t border-border" />
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
                        ? "bg-red-50 dark:bg-red-500/10 text-red-600 ring-1 ring-red-200"
                        : "bg-muted text-foreground ring-1 ring-foreground/15"
                      : tab.danger
                      ? "text-muted-foreground hover:bg-red-50/50 dark:bg-red-500/10 hover:text-red-600"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? tab.danger
                          ? "text-red-600"
                          : "text-foreground"
                        : "text-muted-foreground/70"
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
        <div className="rounded-3xl bg-tile p-6 sm:p-8">
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
