/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output keeps the production image small (see Dockerfile.prod).
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
