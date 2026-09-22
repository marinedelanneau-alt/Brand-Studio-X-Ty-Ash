import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return process.env.BRAND_STUDIO_LEGAL_RELEASE === "enabled" ? [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }] : [];
  },
  deploymentId: process.env.DEPLOYMENT_VERSION,
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
