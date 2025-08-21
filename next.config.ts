import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@node-rs/argon2'],
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
  // Suppress React DevTools warnings in production
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  // Add security headers for iframe embedding
  async headers() {
    return [
      {
        source: '/live',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' http://s.showplustv.pro https://s.showplustv.pro; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.externals.push({
        'drizzle-orm': 'commonjs drizzle-orm',
        'better-sqlite3': 'commonjs better-sqlite3',
        'pg': 'commonjs pg'
      });
    }
    
    // Suppress console warnings in production
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-dom$': 'react-dom/profiling',
        'scheduler/tracing': 'scheduler/tracing-profiling',
      };
    }
    
    return config;
  }
};

export default nextConfig;
