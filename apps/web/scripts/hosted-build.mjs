/**
 * The build for a host that gives the app a database and nothing else: Netlify, with no settings
 * made by hand.
 *
 *   1. Creates or updates the tables from the migration files.
 *   2. Makes sure the first users exist, so the CMS never offers "create the first user" to a stranger.
 *   3. On a preview (SAMPLE_DATA=allow) loads the sample pieces and sample sites.
 *   4. Copies the pictures made in step 3 to where a host with no disk can serve them.
 *   5. Builds the site.
 *
 * Each step uses the same checks as a development machine. Nothing here is skipped quietly: a step
 * that fails stops the build and says why.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";

const env = { ...process.env };
const pooled = env.DATABASE_URL || env.NETLIFY_DATABASE_URL;
const direct = env.DATABASE_URL_UNPOOLED || env.NETLIFY_DATABASE_URL_UNPOOLED || pooled;

if (!direct) {
  console.error(
    [
      "",
      "ohworks cannot be built here: there is no database.",
      "",
      "The site reads every page from Postgres. Give this host one in either way:",
      "  - Netlify: add the Netlify DB (Neon) extension to the site, which sets NETLIFY_DATABASE_URL, or",
      "  - set DATABASE_URL to any Postgres address under Site configuration, Environment variables.",
      "",
      "Then deploy again.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const site = env.NEXT_PUBLIC_SITE_URL || env.URL || env.DEPLOY_PRIME_URL || "http://localhost:3000";
const shared = {
  ...env,
  NEXT_PUBLIC_SITE_URL: site,
  NEXT_TELEMETRY_DISABLED: "1",
  PAYLOAD_CONFIG_PATH: "src/payload.config.ts",
  HOSTED_BUILD: "1",
  // Every step runs as production. In any other mode the CMS would reshape the tables to match the
  // code on its own, and then refuse the next build's migrations until someone answered a question.
  NODE_ENV: "production",
};

function run(label, command, args, extra = {}) {
  console.log(`\n== ${label}`);
  const done = spawnSync(command, args, { stdio: "inherit", env: { ...shared, ...extra } });
  if (done.status !== 0) {
    console.error(`\n"${label}" failed, so the build stops here.`);
    process.exit(done.status ?? 1);
  }
}

// Tables are created over a direct connection. The running site uses the pooled one.
const tables = { DATABASE_URL: direct };

// The CMS's own command reports a failed migration and still exits as if it had worked, so its
// words are read as well as its exit code.
console.log("\n== Create or update the tables");
const migrated = spawnSync("pnpm", ["exec", "payload", "migrate"], {
  env: { ...shared, ...tables },
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const said = `${migrated.stdout ?? ""}${migrated.stderr ?? ""}`;
if (migrated.status !== 0 || /Error running migration|ERROR/.test(said)) {
  // The first lines name the migration and the last name the cause. The middle is the whole of the SQL.
  const lines = said.trimEnd().split("\n");
  console.error([...lines.slice(0, 6), "  ...", ...lines.slice(-25)].join("\n"));
  console.error('\n"Create or update the tables" failed, so the build stops here.');
  process.exit(1);
}
console.log(said.trimEnd().split("\n").slice(-6).join("\n"));
run(
  "First users and the source registry",
  "node",
  ["--import", "tsx", "src/payload/seed.ts"],
  tables,
);

if (env.SAMPLE_DATA === "allow") {
  run("Sample pieces", "node", ["--import", "tsx", "src/payload/seed-demo.ts"], tables);
  run("Sample sites", "node", ["--import", "tsx", "src/payload/seed-sites.ts"], tables);
}

// This host keeps no files between requests, so the pictures made above are published as plain files.
if (env.HOSTED_MEDIA === "static" && existsSync("media")) {
  mkdirSync("public/_media", { recursive: true });
  cpSync("media", "public/_media", { recursive: true });
  console.log("\n== Pictures copied to public/_media");
}

run("Copy the map worker", "node", ["scripts/copy-map-worker.mjs"]);
run("Build the site", "pnpm", ["exec", "next", "build"]);
