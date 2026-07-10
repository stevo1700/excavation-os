/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow external host headers for tunnel/proxy access
  experimental: {
    trustHostHeader: true,
  },
};

export default nextConfig;
