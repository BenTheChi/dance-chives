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
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        dns: false,
      };
    }

    // Silence optional pg-native warnings (pg's native bindings)
    // pg tries to require('pg-native') in a try/catch; we don't use it,
    // so alias it to false so webpack doesn't error or warn.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "pg-native": false,
    };

    return config;
  },
};

export default nextConfig;
