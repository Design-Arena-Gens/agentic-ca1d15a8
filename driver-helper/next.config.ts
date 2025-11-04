import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;
