import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Verification builds use their own folder so the dev server can keep running beside them.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  // The social-card route reads its fonts from disk at run time; make sure they ship with the server.
  outputFileTracingIncludes: { "/og/[pillar]/[slug]": ["./src/assets/fonts/*.woff"] },
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
