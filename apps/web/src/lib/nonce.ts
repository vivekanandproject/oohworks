import { headers } from "next/headers";

/**
 * The nonce the middleware minted for this request's Content Security Policy (src/middleware.ts), for
 * the page's own inline scripts. Next puts it on the scripts it writes by itself; a script written by
 * hand carries it through this. Empty when there is no policy, as in a static render.
 */
export async function scriptNonce(): Promise<string> {
  const policy = (await headers()).get("content-security-policy") ?? "";
  return /'nonce-([A-Za-z0-9+/_-]+={0,2})'/.exec(policy)?.[1] ?? "";
}
