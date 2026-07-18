import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /lp was the original slug for the AI marketing tools landing page;
      // renamed 2026-07-18 to a real, searched phrase per user request.
      // Kept as a permanent redirect in case it was ever shared/bookmarked.
      {
        source: "/lp",
        destination: "/ai-marketing-tools",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
