import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Staging builds (scripts/build-staging.sh) export a static site per
  // direction; normal builds keep the default server output. Trailing slashes
  // make the export a plain folder/index.html tree any static host serves.
  output: process.env.NEXT_OUTPUT === "export" ? "export" : undefined,
  trailingSlash: process.env.NEXT_OUTPUT === "export" ? true : undefined,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
