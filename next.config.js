/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use webpack instead of turbopack (avoids venv symlink issues)
  turbopack: {},
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/python-pdf-api/**', '**/venv/**', '**/.venv/**'],
    };
    return config;
  },
};

module.exports = nextConfig;
