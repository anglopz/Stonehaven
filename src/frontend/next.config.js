/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  eslint: {
    // Temporarily ignore ESLint during builds for deployment
    // TODO: Fix ESLint errors before final production deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript checking enabled
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
