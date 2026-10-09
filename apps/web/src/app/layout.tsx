import type { Metadata } from "next";
import type { ReactNode } from "react";
import { archivo, plexMono, plexSans } from "./fonts";
import { SITE_NAME, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME}: every billboard, findable.`, template: `%s · ${SITE_NAME}` },
  description:
    "Search billboards, hoardings and digital screens, see the verified owner and ask in one step. Owners list free and always sell direct. No media margin, ever.",
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <noscript>
          <style>{`[data-reveal],[data-stagger-item],[data-draw],[data-fade]{opacity:1!important;transform:none!important;stroke-dashoffset:0!important}`}</style>
        </noscript>
      </head>
      <body className="bg-paper text-ink min-h-screen">{children}</body>
    </html>
  );
}
