/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['selenium-webdriver', 'chrome'],
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'chrome'];
    return config;
  },
  output: 'standalone',
};

module.exports = nextConfig;
