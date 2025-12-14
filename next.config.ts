import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.staging if APP_ENV=staging (Next.js doesn't auto-load this)
if (process.env.APP_ENV === "staging") {
  config({ path: resolve(process.cwd(), ".env.staging") });
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/dance-chives-profile-pics/**",
      },
      // Add R2 pattern
      ...(process.env.CLOUDFLARE_R2_PUBLIC_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.CLOUDFLARE_R2_PUBLIC_URL).hostname,
              pathname: "/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ytimg.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
