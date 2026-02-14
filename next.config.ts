import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0",
        },
      ],
    },
  ],
};

export default nextConfig;
