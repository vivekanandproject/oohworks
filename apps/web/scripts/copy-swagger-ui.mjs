/**
 * The API documentation at /api/docs/ is Swagger UI. Its script and stylesheet are copied from the
 * swagger-ui-dist package into public/, so the page loads nothing from another site. Run before
 * `next dev` and `next build`, beside copy-map-worker.mjs.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const from = dirname(require.resolve("swagger-ui-dist/package.json"));
const to = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "vendor", "swagger-ui");
mkdirSync(to, { recursive: true });
for (const file of ["swagger-ui.css", "swagger-ui-bundle.js", "swagger-ui-standalone-preset.js"])
  copyFileSync(join(from, file), join(to, file));
