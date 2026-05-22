import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Exclude @react-pdf/renderer (WASM) from Turbopack bundling.
  // Only list direct dependencies — transitive ones are resolved automatically.
  serverExternalPackages: ['@react-pdf/renderer'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
