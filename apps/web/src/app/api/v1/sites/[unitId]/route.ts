import { apiJson, problem } from "@/lib/api/respond";
import { siteDetail } from "@/lib/api/sites";
import { getSite, listingsFor } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";

/** One published site with everything its page shows. A draft, a withdrawn site or an unknown id is 404. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ unitId: string }> },
): Promise<Response> {
  const { unitId } = await params;
  const id = unitId.toLowerCase();
  const [listing] = /^[a-z0-9-]{1,40}$/.test(id) ? await listingsFor([id]) : [];
  const page = listing ? await getSite(id) : null;
  if (!listing || !page)
    return problem(404, "Site not found", `No published site has the unit ID "${unitId}".`);
  return apiJson(siteDetail(listing, page.site, page.owner, page.ownerSiteCount, Date.now()), 60);
}
