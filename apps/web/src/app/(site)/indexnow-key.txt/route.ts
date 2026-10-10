export const dynamic = "force-dynamic";

/** Proves to IndexNow engines that this site owns its key. Absent unless a key is configured. */
export function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
