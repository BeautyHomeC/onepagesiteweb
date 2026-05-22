import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required: Vercel's modifyConfig calls path.resolve(outputFileTracingRoot)
  // and crashes with ERR_INVALID_ARG_TYPE if it is undefined.
  outputFileTracingRoot: path.resolve("."),

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
