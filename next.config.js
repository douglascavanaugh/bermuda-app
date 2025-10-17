/** @type {import('next').NextConfig} */
const nextConfig = {
  // NUCLEAR RESET: Minimal config to avoid webpack hell
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
