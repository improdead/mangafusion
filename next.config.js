/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // We rely on runtime checks; allow migrating backend TS without blocking builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
