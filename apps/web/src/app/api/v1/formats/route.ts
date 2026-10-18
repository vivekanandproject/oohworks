import { absolute } from "@/lib/seo";
import { apiJson } from "@/lib/api/respond";
import { catalogueCounts } from "@/lib/sites/queries";
import { FORMATS } from "@/lib/sites/taxonomy";

export const dynamic = "force-dynamic";

/** The kinds of advertising face ohworks lists, with how many published sites each has. */
export async function GET(): Promise<Response> {
  const { formats } = await catalogueCounts();
  return apiJson(
    {
      formats: FORMATS.map((f) => ({
        slug: f.slug,
        label: f.label,
        plural: f.plural,
        sites: formats.get(f.slug) ?? 0,
        searchUrl: absolute(`/search/?format=${f.slug}`),
      })),
    },
    300,
  );
}
