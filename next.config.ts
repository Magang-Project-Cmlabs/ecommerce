import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Gambar placeholder data demo (prisma/seed.ts). Gambar unggahan admin
      // (lokal / S3) ditambahkan saat kartu upload dikerjakan.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
