import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

/**
 * Display face: titles only. Archivo's width axis lets headings sit semi-expanded at a heavy
 * weight, the lettering of a painted signboard. Preloaded and "optional": it is the LCP text,
 * and it is either ready at first paint or never swapped in, so the hero never reflows.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "optional",
  preload: true,
});

/** Interface and body. Preloaded and "optional": ready at first paint or never swapped in. */
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
