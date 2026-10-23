import { siteUrl } from "./hosting";

/**
 * Tells IndexNow engines (Bing, Yandex, Naver, Seznam, and through Bing the assistants built on it)
 * that pages changed, so they recrawl in minutes. Google does not take part; it reads the sitemap.
 * Off unless INDEXNOW_KEY is set and the site has a public https address. A failed ping never blocks
 * a save: the sitemap still carries the change.
 */
export async function pingIndexNow(paths: (string | null | undefined)[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  const site = siteUrl();
  const urls = [...new Set(paths.filter((p): p is string => Boolean(p)))].map((p) => `${site}${p}`);
  if (!key || !urls.length || !site.startsWith("https://")) return;
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(site).host,
        key,
        keyLocation: `${site}/indexnow-key.txt`,
        urlList: urls,
      }),
    });
  } catch {
    // Discovery is only delayed.
  }
}
