import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required: Vercel's modifyConfig calls path.resolve(outputFileTracingRoot)
  // and crashes with ERR_INVALID_ARG_TYPE if it is undefined.
  outputFileTracingRoot: path.resolve("."),

  // Ensure public/documents PDFs are included in the serverless bundle so
  // readFileSync works in API routes deployed to Vercel.
  outputFileTracingIncludes: {
    '/api/webhook/stripe': ['./public/documents/**/*'],
    '/api/admin/reservations/**': ['./public/documents/**/*'],
  },

  // Exclude @react-pdf/renderer and its WASM dependency from bundling.
  // These packages rely on yoga-wasm-web which must be loaded by Node.js at
  // runtime from node_modules — bundling them breaks the WASM initialisation
  // and causes "f/m is not a function" errors at runtime.
  serverExternalPackages: [
    '@react-pdf/renderer',
    'yoga-wasm-web',
  ],

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

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
