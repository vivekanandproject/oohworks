import { rateLimited } from "@/lib/forms";
import { searchPlaces, type Scope } from "@/lib/places";
import { json, ownPage, sessionOf } from "@/lib/places/request";

export const dynamic = "force-dynamic";

/** Places matching what a visitor has typed so far. The key to the search service never leaves the server. */
export async function GET(req: Request) {
  if (!ownPage(req)) return json({ suggestions: [] }, 403);
  if (rateLimited(req, "places", 90)) return json({ suggestions: [] }, 429);
  const url = new URL(req.url);
  const scope: Scope = url.searchParams.get("scope") === "any" ? "any" : "city";
  return json(
    await searchPlaces(
      url.searchParams.get("q") ?? "",
      scope,
      sessionOf(url.searchParams.get("s")),
    ),
  );
}
