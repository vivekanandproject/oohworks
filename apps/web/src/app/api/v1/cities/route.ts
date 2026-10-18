import { absolute } from "@/lib/seo";
import { apiJson } from "@/lib/api/respond";
import { catalogueCounts } from "@/lib/sites/queries";
import { CITIES } from "@/lib/sites/taxonomy";

export const dynamic = "force-dynamic";

/** The cities ohworks lists sites in, with how many published sites each has. */
export async function GET(): Promise<Response> {
  const { cities } = await catalogueCounts();
  return apiJson(
    {
      cities: CITIES.map((c) => ({
        slug: c.slug,
        label: c.label,
        sites: cities.get(c.slug) ?? 0,
        searchUrl: absolute(`/search/?city=${c.slug}`),
      })),
    },
    300,
  );
}
