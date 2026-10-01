import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
