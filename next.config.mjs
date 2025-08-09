/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Speed up CI builds: lint in separate job, not during next build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Speed up CI builds: allow build even if types have issues
    // (Local dev and IDE still report type errors.)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
