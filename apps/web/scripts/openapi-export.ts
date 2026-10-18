/**
 * Writes the API descriptions as JSON files, for linting or publishing elsewhere:
 *   node --import tsx scripts/openapi-export.ts <folder>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { internalSpec } from "../src/lib/api/openapi/internal";
import { publicSpec } from "../src/lib/api/openapi/public-v1";

const out = path.resolve(process.argv[2] ?? "openapi");
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "public-v1.json"), `${JSON.stringify(publicSpec, null, 2)}\n`);
writeFileSync(path.join(out, "internal.json"), `${JSON.stringify(internalSpec, null, 2)}\n`);
console.log(`API descriptions written to ${out}`);
process.exit(0);
