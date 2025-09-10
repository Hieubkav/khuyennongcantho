import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kndvnn.cantho.vn",
        pathname: "/**",
      },
    ],
  },
};

export default withMDX(nextConfig);
