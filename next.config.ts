import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const nextConfig: NextConfig = {
  distDir: "dist",
  basePath: "/borrower",
  env: {
    NEXT_PUBLIC_API_BASE_URL: API_BASE_URL,
  },
  async rewrites() {
    return [
      {
        source: "/auth-svc/:path*",
        destination: `${API_BASE_URL}/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
