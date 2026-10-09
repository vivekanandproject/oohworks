import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export * from "./schema/index";

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function db() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const client = postgres(url, { max: 10, prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}
