import { siteUrl } from "../hosting";

/**
 * WebSub (formerly PubSubHubbub): the feeds name this hub, and publishing tells the hub the feeds
 * changed, so Google and feed readers fetch the new piece in seconds instead of at their next crawl.
 * IndexNow, which the publish hook also pings, does not reach Google; this does.
 */
export const WEBSUB_HUB = "https://pubsubhubbub.appspot.com/";

export const FEED_PATHS = ["/feed.xml", "/feed.json"] as const;

/** Tells the hub both feeds changed. Off on a local or test address; a failure never blocks publishing. */
export async function pingWebSub(): Promise<void> {
  const site = siteUrl();
  if (!site.startsWith("https://")) return;
  await Promise.all(
    FEED_PATHS.map(async (path) => {
      try {
        await fetch(WEBSUB_HUB, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ "hub.mode": "publish", "hub.url": `${site}${path}` }),
        });
      } catch {
        // The hub being down only delays discovery; the sitemaps still carry the piece.
      }
    }),
  );
}
