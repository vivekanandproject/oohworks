import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Test builds use their own folder (scripts/test-env.mjs), so the dev server can keep running beside them.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  // The social-card route reads its fonts from disk at run time; make sure they ship with the server.
  outputFileTracingIncludes: { "/og/[pillar]/[slug]": ["./src/assets/fonts/*.woff"] },
  transpilePackages: ["@ohworks/core", "@ohworks/db", "@ohworks/ui"],
  trailingSlash: true,
  poweredByHeader: false,
  // The title, description, canonical link and robots tag are always sent in the head. Left alone,
  // Next.js sends them later, inside the body, to any visitor it does not list as a simple crawler,
  // and that includes Googlebot. A canonical link or a noindex in the body can be ignored.
  htmlLimitedBots: /.*/,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**.ohworks.com" }],
  },
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
