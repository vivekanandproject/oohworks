/**
 * The setting every test run works in: its own database, its own folder for uploads, its own build
 * and its own address. The test data (sample sites, owners and pieces) lives only there, so it never
 * reaches the development database, and a real database never sees it.
 *
 * Used by test-db.mjs, by the Playwright and Lighthouse servers, and from the command line:
 *
 *   node scripts/test-env.mjs next build      runs a command in the test setting
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP_DIR = path.resolve(here, "..");
export const TEST_PORT = 3100;

/** The test database: TEST_DATABASE_URL, or the development address with the name `ohworks_test`. */
export function testDatabaseUrl(env = process.env) {
  if (env.TEST_DATABASE_URL) return env.TEST_DATABASE_URL;
  const url = new URL(env.DATABASE_URL || "postgres://ohworks:ohworks@localhost:5432/ohworks");
  url.pathname = "/ohworks_test";
  return url.toString();
}

/** Test data may only be written to a database whose name ends in `_test`. */
export function isTestDatabase(address) {
  try {
    return /_test$/.test(new URL(address).pathname);
  } catch {
    return false;
  }
}

export function testEnv(env = process.env) {
  // Next.js picks its own mode for build and start; the "development" that .env sets breaks the build.
  const rest = { ...env };
  delete rest.NODE_ENV;
  return {
    ...rest,
    DATABASE_URL: testDatabaseUrl(env),
    UPLOADS_DIR: path.join(APP_DIR, "test-data"),
    NEXT_DIST_DIR: ".next-verify",
    SITE_URL: `http://127.0.0.1:${TEST_PORT}`,
    NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${TEST_PORT}`,
    NEXT_TELEMETRY_DISABLED: "1",
    // A test run, so the internal API reference is served and can be checked (src/lib/api/env.ts).
    SITE_ENV: "test",
    // Hubs open below their threshold, marked as previews, so their pages can be tested on samples.
    HUB_PREVIEW: "1",
    // Tests read every email from the Outbox and never call an outside service, whatever .env holds.
    RESEND_API_KEY: "",
    ANTHROPIC_API_KEY: "",
    GOOGLE_MAPS_API_KEY: "",
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.error("Usage: node scripts/test-env.mjs <command> [args...]");
    process.exit(2);
  }
  const done = spawnSync(command, args, { cwd: APP_DIR, stdio: "inherit", env: testEnv() });
  if (done.error) console.error(done.error.message);
  process.exit(done.status ?? 1);
}
