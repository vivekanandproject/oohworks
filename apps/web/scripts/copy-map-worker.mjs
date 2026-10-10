/**
 * The map library runs its heavy work in a background worker, which it expects to find as a file
 * beside itself. Once the library is bundled that file is no longer beside it, so the map would draw
 * pins on an empty background. This copies the worker into public/, where the site serves it, and
 * the live map is told to load it from there. Run before `next dev` and `next build`.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const from = join(
  dirname(require.resolve("maplibre-gl/package.json")),
  "dist",
  "maplibre-gl-worker.mjs",
);
const to = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "vendor");
mkdirSync(to, { recursive: true });
copyFileSync(from, join(to, "maplibre-gl-worker.mjs"));
