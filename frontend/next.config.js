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
};

// const withTM = require("next-transpile-modules")(["react-tradingview-embed"]);
module.exports =  nextConfig;
