import { apiJson, problem } from "@/lib/api/respond";
import { MAX_PER_PAGE, appliedFilters, siteSummary } from "@/lib/api/sites";
import { PER_PAGE, searchSites } from "@/lib/sites/queries";
import { readState, type RawParams } from "@/lib/sites/state";

export const dynamic = "force-dynamic";

/** Published sites, filtered and ordered exactly as the search page does, a page at a time. */
export async function GET(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams;
  const asked = params.get("per_page");
  const perPage = asked === null ? PER_PAGE : Number(asked);
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > MAX_PER_PAGE)
    return problem(400, "Bad per_page", `per_page is a whole number from 1 to ${MAX_PER_PAGE}.`);

  const raw: RawParams = {};
  for (const key of new Set(params.keys())) raw[key] = params.get(key) ?? undefined;
  const { state } = readState(raw);
  const result = await searchSites(state, perPage);
  const now = Date.now();
  return apiJson(
    {
      page: state.page,
      perPage,
      total: result.total,
      pages: result.pages,
      filters: appliedFilters(state),
      sites: result.cards.map((c) => siteSummary(c.listing, c.site, c.owner, now)),
    },
    60,
  );
}
