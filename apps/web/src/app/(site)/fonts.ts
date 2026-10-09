import { Archivo, IBM_Plex_Mono } from "next/font/google";

/**
 * The primary face for everything that is not measured data: Archivo, a variable grotesque with
 * weight and width axes. Body sits at normal width; titles sit semi-expanded and heavy, the
 * lettering of a painted signboard. One file, preloaded, "optional": ready at first paint or never
 * swapped in, so nothing reflows.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "optional",
  preload: true,
});

/** Anything measured or identified: coordinates, IDs, dimensions, prices, timestamps. */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "optional",
  preload: true,
});
