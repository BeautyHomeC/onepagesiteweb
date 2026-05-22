import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Exclude packages with WASM or native bindings from Turbopack bundling.
  // These must be required at runtime via Node.js, not bundled at compile time.
  serverExternalPackages: [
    '@react-pdf/renderer',
    '@react-pdf/font',
    '@react-pdf/layout',
    '@react-pdf/primitives',
    'yoga-wasm-web',
    'canvas',
  ],

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
