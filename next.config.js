/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Allow cross-origin requests during development
  experimental: {
    allowedDevOrigins: [
      "localhost:3000",
      "192.168.68.100:3000"
    ],
  },
};

module.exports = nextConfig;
