import { rateLimited } from "@/lib/forms";
import { launchCity, placeDetail } from "@/lib/places";
import { json, ownPage, sessionOf } from "@/lib/places/request";

export const dynamic = "force-dynamic";

/** What is known about the place a visitor picked: where it is, and which country it is in. */
export async function GET(req: Request) {
  if (!ownPage(req)) return json({ place: null }, 403);
  if (rateLimited(req, "places-detail", 40)) return json({ place: null }, 429);
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").slice(0, 2000);
  const place = await placeDetail(id, sessionOf(url.searchParams.get("s")));
  return json({ place, city: place ? launchCity(place) : null });
}
