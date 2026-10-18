import pg from "pg";
import { isTestDatabase, testDatabaseUrl } from "../../scripts/test-env.mjs";

/**
 * Reads the test database directly, so a test can check what was stored, not only what a page or the
 * API shows. Read-only by habit: tests change data through the app. It refuses any database whose
 * name does not end in `_test`.
 */
let client: pg.Client | null = null;

async function connect(): Promise<pg.Client> {
  if (client) return client;
  const url = testDatabaseUrl(process.env);
  if (!isTestDatabase(url)) throw new Error(`Refusing to read ${url}: not a _test database.`);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  client = c;
  return c;
}

/** Rows from a query on the test database. Tables are in the `payload` schema. */
export async function rows<T extends Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  return (await (await connect()).query<T>(sql, values)).rows;
}

/** One row, or undefined. */
export async function row<T extends Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T | undefined> {
  return (await rows<T>(sql, values))[0];
}

export async function closeDb(): Promise<void> {
  await client?.end();
  client = null;
}
