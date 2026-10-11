/** A JSON answer that is never kept by a browser or a proxy. */
export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/** Only this site's own pages may ask: a search service is paid for by the question. */
export function ownPage(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  return site === null || site === "same-origin";
}

/** The token a browser makes for one run of typing, so a paid service bills it as one search. */
export const sessionOf = (value: string | null): string =>
  value && /^[0-9a-f-]{36}$/.test(value) ? value : "";
