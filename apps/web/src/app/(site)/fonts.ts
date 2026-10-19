import { IBM_Plex_Mono, Poppins } from "next/font/google";

/**
 * The one face for everything that is not measured data: Poppins, a geometric sans. Titles at 600
 * and 700, text at 400 with 500 and 600 for emphasis. Poppins also draws Devanagari, so a Hindi
 * edition can stay in the same family (add "devanagari" to the subsets when it ships).
 * Preloaded and "optional": ready at first paint or never swapped in, so nothing reflows.
 */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
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
