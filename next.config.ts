import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      // AWS S3 - your bucket hostname
      {
        protocol: "https",
        hostname: "**.s3.**.amazonaws.com",
      },
      // Supabase storage
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      // Allow all other external images (fallback)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  // Vercel deployment configuration
  serverExternalPackages: ["@aws-sdk/client-s3"],
};

export default nextConfig;
