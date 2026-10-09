import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ohworks/core", "@ohworks/db", "@ohworks/ui"],
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**.ohworks.com" }],
  },
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
