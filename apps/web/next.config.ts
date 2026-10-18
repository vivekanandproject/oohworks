import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * The image library ships its engine for every kind of computer, about 20 MB each, and a package
 * manager may install them all. A serverless host limits how large the server may be and runs on one
 * kind only, so when the build names it, the others are left out of the server.
 */
const SHARP_BUILDS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm",
  "linux-arm64",
  "linux-ppc64",
  "linux-riscv64",
  "linux-s390x",
  "linux-x64",
  "linuxmusl-arm64",
  "linuxmusl-x64",
  "win32-arm64",
  "win32-ia32",
  "win32-x64",
  "wasm32",
  "freebsd-wasm32",
  "webcontainers-wasm32",
];
const runsOn = process.env.FUNCTION_PLATFORM;
const otherBuilds = runsOn
  ? SHARP_BUILDS.filter((b) => b !== runsOn).flatMap((b) => [
      `**/@img+sharp-${b}@*/**`,
      `**/@img+sharp-libvips-${b}@*/**`,
      `**/node_modules/@img/sharp-${b}/**`,
      `**/node_modules/@img/sharp-libvips-${b}/**`,
    ])
  : [];

const nextConfig: NextConfig = {
  // Verification builds use their own folder so the dev server can keep running beside them.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  // The social-card route reads its fonts from disk at run time; make sure they ship with the server.
  outputFileTracingIncludes: { "/og/[pillar]/[slug]": ["./src/assets/fonts/*.woff"] },
  ...(otherBuilds.length ? { outputFileTracingExcludes: { "*": otherBuilds } } : {}),
  transpilePackages: ["@ohworks/core", "@ohworks/db", "@ohworks/ui"],
  trailingSlash: true,
  poweredByHeader: false,
  // Read when the site is built and carried into the server, for hosts whose settings file is not
  // seen by the running app. Neither is a secret.
  env: {
    HUB_PREVIEW: process.env.HUB_PREVIEW ?? "",
    HOSTED_MEDIA: process.env.HOSTED_MEDIA ?? "",
  },
  // A host with no disk to keep files on serves the pictures made at build time as plain files.
  async rewrites() {
    if (process.env.HOSTED_MEDIA !== "static") return [];
    return {
      beforeFiles: [
        { source: "/api/media/file/:file", destination: "/_media/:file" },
        { source: "/api/media/file/:file/", destination: "/_media/:file" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
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
