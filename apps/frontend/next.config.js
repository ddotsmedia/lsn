/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Disable font optimization to avoid webpack errors with Google Fonts
  optimizeFonts: false,
  
  // Preload less aggressively to avoid network issues
  experimental: {
    optimizePackageImports: ["@radix-ui", "lucide-react"],
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "http://backend:3001/api/:path*",
        },
      ],
    };
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
};

module.exports = nextConfig;
