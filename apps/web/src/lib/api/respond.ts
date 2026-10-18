/**
 * Answers from the public API. Any site may read it from a browser, no answer is for search engines,
 * and an error is a problem document (RFC 9457) that says what went wrong in words.
 */
const COMMON = {
  "Access-Control-Allow-Origin": "*",
  "X-Robots-Tag": "noindex",
};

export function apiJson(body: unknown, maxAgeSeconds = 0): Response {
  return Response.json(body, {
    headers: {
      ...COMMON,
      "Cache-Control": maxAgeSeconds ? `public, max-age=${maxAgeSeconds}` : "no-store",
    },
  });
}

export function problem(status: number, title: string, detail: string): Response {
  return new Response(JSON.stringify({ type: "about:blank", title, status, detail }), {
    status,
    headers: {
      ...COMMON,
      "Content-Type": "application/problem+json",
      "Cache-Control": "no-store",
    },
  });
}
