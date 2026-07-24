import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
// tera-be/LOS: the gateway prefix is /tera-svc → :8088. My-loans reads the
// borrower's applications from it. In local dev we bypass the JWT-enforcing
// gateway and forward straight to tera-be (tera.authz.enforce=false), stripping
// the /tera-svc prefix. Mirrors the landing dev proxy; override with TERA_BE_ORIGIN.
const TERA_BE_ORIGIN = process.env.TERA_BE_ORIGIN ?? "http://localhost:8088";

const nextConfig: NextConfig = {
  distDir: "dist",
  basePath: "/borrower-portal",
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
      {
        source: "/tera-svc/:path*",
        destination: `${TERA_BE_ORIGIN}/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
