/** @type {import('next').NextConfig} */
// const { withPlugins } = require("next-compose-plugins");
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
  async rewrites() {
    // Use 127.0.0.1 instead of localhost to avoid conflicts with Apple services
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:5002';
    return [
      {
        source: '/ccxt/:path*',
        destination: `${backendUrl}/ccxt/:path*`,
      },
      {
        source: '/hyperliquid',
        destination: `${backendUrl}/hyperliquid`,
      },
      {
        source: '/status',
        destination: `${backendUrl}/status`,
      },
    ];
  },
};

// const withTM = require("next-transpile-modules")(["react-tradingview-embed"]);
module.exports =  nextConfig;
