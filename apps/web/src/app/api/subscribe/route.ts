import { getPayload } from "payload";
import config from "@payload-config";
import { cleanEmail, rateLimited, safePath, seeOther } from "@/lib/forms";

export const dynamic = "force-dynamic";

const DONE = "/newsroom/subscribed/";

/** Adds an email to the daily briefing list. Honeypot-filled and rate-limited posts succeed silently. */
export async function POST(req: Request) {
  const form = await req.formData();
  if (String(form.get("company") ?? "") || rateLimited(req, "subscribe"))
    return seeOther(req, DONE);

  const email = cleanEmail(form.get("email"));
  if (!email) return seeOther(req, `${DONE}?error=email`);

  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: "subscribers",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: "subscribers",
      data: {
        email,
        lists: ["daily"],
        source: safePath(form.get("from"), "/newsroom/").slice(0, 200),
      },
      overrideAccess: true,
    });
  }
  return seeOther(req, DONE);
}
