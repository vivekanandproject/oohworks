/**
 * Checks both API descriptions with Redocly's linter, using redocly.yaml. Fails on an error, not on a
 * warning: the site's form endpoints answer 303 by design, which Redocly warns about.
 *   pnpm --filter @ohworks/web openapi:lint
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = mkdtempSync(path.join(tmpdir(), "ohworks-openapi-"));
const run = (command, args) => spawnSync(command, args, { cwd: app, stdio: "inherit" }).status ?? 1;

let status = run("node", ["--import", "tsx", "scripts/openapi-export.ts", out]);
if (status === 0)
  status = run("pnpm", [
    "--package=@redocly/cli@1",
    "dlx",
    "redocly",
    "lint",
    path.join(out, "public-v1.json"),
    path.join(out, "internal.json"),
    "--config",
    "redocly.yaml",
    "--format=summary",
  ]);
rmSync(out, { recursive: true, force: true });
process.exit(status);
