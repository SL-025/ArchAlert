/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Anything the frontend calls at /api/... will be forwarded to FastAPI inside the same container.
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/:path*" },
    ];
  },
};

module.exports = nextConfig;
