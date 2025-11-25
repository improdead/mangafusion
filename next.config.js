/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    // We rely on runtime checks; allow migrating backend TS without blocking builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Suppress Fast Refresh warnings
      config.infrastructureLogging = {
        level: 'error',
      };
    }

    // Suppress critical dependency warnings from third-party packages
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry/ },
      { module: /node_modules\/@prisma/ },
      { module: /node_modules\/@sentry/ },
      { module: /node_modules\/bullmq/ },
      { module: /node_modules\/require-in-the-middle/ },
    ];

    // Prevent BullMQ from trying to use worker threads in Next.js
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'bullmq': 'commonjs bullmq',
      });
    }

    return config;
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_BASE;
    // If NEXT_PUBLIC_API_BASE is an absolute URL, proxy to it; otherwise use internal API routes
    if (backend && /^https?:\/\//.test(backend)) {
      return [
        {
          source: '/api/:path*',
          destination: `${backend}/:path*`,
        },
      ];
    }
    return [];
  },
};
module.exports = nextConfig;
