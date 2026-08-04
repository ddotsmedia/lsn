/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output keeps the production image small (see Dockerfile.prod).
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // The About content now lives at /nursery, matching the nav label. Kept as a
  // permanent redirect so existing links to /about keep working.
  async redirects() {
    return [{ source: '/about', destination: '/nursery', permanent: true }];
  },
};

export default nextConfig;
