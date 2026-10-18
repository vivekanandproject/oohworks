import { getPayload } from "payload";
import config from "@payload-config";
import { serviceReports } from "@/lib/api/services";

export const dynamic = "force-dynamic";

/** Which services this environment is connected to, and whether each answers. Signed-in staff only. */
export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user || user.collection !== "users" || (user as { active?: boolean }).active === false)
    return Response.json(
      {
        type: "about:blank",
        title: "Sign in",
        status: 401,
        detail: "Sign in to the CMS as staff.",
      },
      { status: 401, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
    );
  return Response.json(await serviceReports(payload), {
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
