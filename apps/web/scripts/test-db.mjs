/**
 * Makes the test database from nothing: drops it, creates it, then loads the users and reference data
 * a real site has, followed by the test data in e2e/fixtures (sample pieces, owners and sites).
 * Uploads made along the way go to test-data/, not to the app's own folders.
 *
 *   pnpm --filter @ohworks/web test:db
 *
 * It works only on a database whose name ends in `_test`, so it cannot touch development or production.
 */
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { APP_DIR, isTestDatabase, testEnv } from "./test-env.mjs";

const env = testEnv();
const target = new URL(env.DATABASE_URL);
const name = target.pathname.slice(1);

if (!isTestDatabase(env.DATABASE_URL)) {
  console.error(`Refusing to load test data into "${name}": a test database's name ends in _test.`);
  process.exit(1);
}

function run(label, command, args, options = {}) {
  console.log(`\n== ${label}`);
  const done = spawnSync(command, args, { cwd: APP_DIR, stdio: "inherit", env, ...options });
  if (done.error?.code === "ENOENT") {
    console.error(`"${command}" is not installed. It comes with the Postgres client tools.`);
    process.exit(1);
  }
  if (done.status !== 0) {
    console.error(`\n"${label}" failed, so the test database is not ready.`);
    process.exit(done.status ?? 1);
  }
}

// The server's own database is used to drop and create the test one.
const admin = new URL(target);
admin.pathname = "/postgres";
run("Start the test database afresh", "psql", [
  admin.toString(),
  "--quiet",
  "--set=ON_ERROR_STOP=1",
  "--command",
  `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`,
  "--command",
  `CREATE DATABASE "${name}"`,
]);
rmSync(env.UPLOADS_DIR, { recursive: true, force: true });

const tsx = (file) => ["--import", "tsx", path.join(APP_DIR, file)];
run("Users, tags, companies and the source registry", "node", tsx("src/payload/seed.ts"));
run("Sample pieces", "node", tsx("e2e/fixtures/pieces.ts"));
run("Sample owners and sites", "node", tsx("e2e/fixtures/sites.ts"));
console.log(`\nThe test database "${name}" is ready.`);
