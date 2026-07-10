/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/dashboard/quotes",
        destination: "/dashboard/documents",
        permanent: false,
      },
      {
        source: "/dashboard/invoices",
        destination: "/dashboard/documents",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
