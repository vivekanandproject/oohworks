import { Pool } from "pg";
import { databaseUrl } from "@/lib/hosting";

/**
 * Whether a site was taken down, for the middleware: a page cannot set its own status, so the
 * middleware answers 410 Gone for a removed site and the page then says so (src/middleware.ts). A plain
 * query on a pool of its own, not the CMS, so the middleware stays light and never crowds the CMS's
 * connections. It fails open: on an error or a slow answer it says "not gone", and the page still
 * shows the truth, so a database blip never takes site pages down.
 */

const LIVE_MS = 30_000;
const GONE_MS = 10 * 60_000;
const WAIT_MS = 300;
const REMEMBERED = 5_000;

const seen = new Map<string, { gone: boolean; until: number }>();
let pool: Pool | null = null;

async function lookUp(permanentId: string): Promise<boolean | null> {
  const url = databaseUrl();
  if (!url) return null;
  pool ??= new Pool({
    connectionString: url,
    max: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: WAIT_MS,
    query_timeout: WAIT_MS,
  });
  const res = await pool.query<{ removed: boolean | null }>(
    "select removed from payload.sites where permanent_id = $1 limit 1",
    [permanentId],
  );
  return res.rows[0]?.removed === true;
}

export async function isGone(permanentId: string, now = Date.now()): Promise<boolean> {
  const hit = seen.get(permanentId);
  if (hit && hit.until > now) return hit.gone;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const gone = await Promise.race([
      lookUp(permanentId),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), WAIT_MS);
      }),
    ]);
    if (gone === null) return false;
    if (seen.size >= REMEMBERED) seen.clear();
    seen.set(permanentId, { gone, until: now + (gone ? GONE_MS : LIVE_MS) });
    return gone;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
