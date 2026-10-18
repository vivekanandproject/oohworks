import { apiJson, problem } from "@/lib/api/respond";
import { absolute } from "@/lib/seo";
import { indiaDate } from "@/lib/sites/calendar";
import { ownerPage } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";

/** An owner with at least one published site: who they are and where they sell. Never contact details. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const data = /^[a-z0-9-]{1,80}$/.test(slug) ? await ownerPage(slug, 1) : null;
  if (!data)
    return problem(404, "Owner not found", `No owner with published sites has the slug "${slug}".`);
  const { owner } = data;
  return apiJson(
    {
      slug,
      name: owner.name,
      verified: Boolean(owner.verified),
      verifiedOn:
        owner.verified && owner.verifiedOn ? indiaDate(Date.parse(owner.verifiedOn)) : null,
      about: owner.about || null,
      medianReplyHours: owner.medianReplyHours ?? null,
      sites: data.total,
      cities: data.cities,
      formats: data.formats,
      sample: Boolean(owner.sample),
      url: absolute(`/owners/${slug}/`),
      sitesUrl: absolute(`/api/v1/sites/?owner=${slug}`),
    },
    60,
  );
}
