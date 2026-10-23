import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { plexMono, poppins } from "./fonts";
import { SITE_NAME, siteUrl } from "@/lib/seo";
import { OWNER_BAR_COOKIE } from "@/lib/sites/enquiry";
import { scriptNonce } from "@/lib/nonce";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME}: every billboard, findable.`, template: `%s · ${SITE_NAME}` },
  description:
    "Search billboards, hoardings and digital screens, see the verified owner and ask in one step. Owners list free and always sell direct. No media margin, ever.",
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  // Ownership tags for Google Search Console and Bing Webmaster Tools, set per host so staging never
  // claims production. Read at build time: changing one needs a redeploy.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f5f2",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = await scriptNonce();
  return (
    // The script below adds data-bar to this element before React wakes up, which is expected.
    <html lang="en" className={`${poppins.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* The page crossfade is asked for here as well as in the stylesheet: a browser decides
            before the body is read, which can be before the stylesheet has arrived. */}
        <style>{`@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}`}</style>
        {/* A signed-in owner's browser carries a marker. Reading it here, before anything is drawn,
            lets the bar show "Your sites" on pages that are otherwise the same for everyone. */}
        {/* The browser blanks a nonce once it has read it, so React must not compare that attribute. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `if(/(?:^|; )${OWNER_BAR_COOKIE}=owner/.test(document.cookie))document.documentElement.dataset.bar="owner"`,
          }}
        />
        <noscript>
          <style>{`[data-reveal],[data-stagger-item],[data-draw],[data-fade]{opacity:1!important;transform:none!important;stroke-dashoffset:0!important}`}</style>
        </noscript>
      </head>
      <body className="bg-paper text-ink min-h-screen">{children}</body>
    </html>
  );
}
