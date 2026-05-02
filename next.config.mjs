/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Localhost-only by default; Next dev server already binds to 127.0.0.1.
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
