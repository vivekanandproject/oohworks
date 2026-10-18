/**
 * Prepares a database for a new release, before the new version takes traffic:
 *
 *   1. Creates or updates the tables from the files in src/migrations.
 *   2. Makes sure the first users and the reference data exist (src/payload/seed.ts), so the CMS never
 *      offers "create the first user" to a stranger. No sample content is ever loaded.
 *
 * On Google Cloud Run this is the release job; on any machine it is
 *   DATABASE_URL=... SEED_ADMIN_PASSWORD=... node scripts/release.mjs
 *
 * Nothing is skipped quietly: a step that fails stops the release and says why.
 */
import { spawnSync } from "node:child_process";

const env = { ...process.env };
// Tables are created over a direct connection. A running site may use a pooled one.
const direct = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;

if (!direct) {
  console.error("\nThere is no database to release to. Set DATABASE_URL, and run this again.\n");
  process.exit(1);
}

const shared = {
  ...env,
  DATABASE_URL: direct,
  PAYLOAD_CONFIG_PATH: "src/payload.config.ts",
  // Every step runs as production. In any other mode the CMS would reshape the tables to match the
  // code on its own, and then refuse the next release's migrations until someone answered a question.
  NODE_ENV: "production",
};

// The CMS's own command reports a failed migration and still exits as if it had worked, so its
// words are read as well as its exit code.
console.log("\n== Create or update the tables");
const migrated = spawnSync("pnpm", ["exec", "payload", "migrate"], {
  env: shared,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const said = `${migrated.stdout ?? ""}${migrated.stderr ?? ""}`;
if (migrated.status !== 0 || /Error running migration|ERROR/.test(said)) {
  // The first lines name the migration and the last name the cause. The middle is the whole of the SQL.
  const lines = said.trimEnd().split("\n");
  console.error([...lines.slice(0, 6), "  ...", ...lines.slice(-25)].join("\n"));
  console.error('\n"Create or update the tables" failed, so the release stops here.');
  process.exit(1);
}
console.log(said.trimEnd().split("\n").slice(-6).join("\n"));

console.log("\n== First users and reference data");
const seeded = spawnSync("node", ["--import", "tsx", "src/payload/seed.ts"], {
  stdio: "inherit",
  env: shared,
});
if (seeded.status !== 0) {
  console.error('\n"First users and reference data" failed, so the release stops here.');
  process.exit(seeded.status ?? 1);
}
