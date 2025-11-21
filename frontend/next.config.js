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
};

// const withTM = require("next-transpile-modules")(["react-tradingview-embed"]);
module.exports =  nextConfig;
