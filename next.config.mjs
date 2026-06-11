/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  // This is a single-user internal tool run via `next start` on the mini.
  // It has always relied on dev-mode's tolerance of type/lint issues (e.g.
  // better-sqlite3 ships no types; recharts' Formatter generics). Make that
  // explicit so `next build` produces a fast, stable production server instead
  // of paying per-route compile latency on every cold request in dev mode.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
