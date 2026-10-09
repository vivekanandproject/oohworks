import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

/** Display face: titles only. Preloaded because the H1 is the LCP element. */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  // "optional" so a late font never reflows the hero; it is preloaded and self-hosted, so it is late only on a cold, slow first visit.
  display: "optional",
  preload: true,
});

/** Interface and body. Preloaded and "optional": ready at first paint or never swapped in, so no reflow. */
export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "optional",
  preload: true,
});

/** Anything measured or identified. */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "optional",
  preload: true,
});
