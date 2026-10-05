/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

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

  async redirects() {
    return [{ source: '/about', destination: '/nursery', permanent: true }];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
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
