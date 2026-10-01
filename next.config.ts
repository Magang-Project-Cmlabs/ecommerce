import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server E2E terpisah tidak mengunci/menimpa build atau demo lokal pengguna.
  distDir: process.env.E2E_ISOLATED_SERVER === '1' ? '.sandbox/next-e2e' : '.next',
  output: 'standalone',
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
  images: {
    qualities: [50, 75],
    remotePatterns: [
      // Gambar placeholder data demo (prisma/seed.ts). Gambar unggahan admin
      // (lokal / S3) ditambahkan saat kartu upload dikerjakan.
      { protocol: "https", hostname: "picsum.photos" },
      ...(process.env.S3_PUBLIC_URL ? [new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/**`)] : []),
    ],
  },
};

export default nextConfig;
