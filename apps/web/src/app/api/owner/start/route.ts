import { cleanEmail, rateLimited, seeOther } from "@/lib/forms";
import { recentCodes, startCode } from "@/lib/owners/server";
import { sameOrigin } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** The first step of listing: an owner gives their work email and is sent a code to prove it is theirs. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  if (String(form.get("website") ?? "")) return seeOther(req, "/list-your-sites/");
  if (rateLimited(req, "owner-start", 10)) return seeOther(req, "/list-your-sites/?error=busy");
  const email = cleanEmail(form.get("email"));
  if (!email) return seeOther(req, "/list-your-sites/?error=email");
  // One address can ask for five codes an hour, so the form cannot be used to flood someone's inbox.
  if ((await recentCodes(email, Date.now())) >= 5)
    return seeOther(req, "/list-your-sites/?error=busy");
  try {
    return seeOther(req, `/list-your-sites/confirm/?t=${await startCode(email)}`);
  } catch {
    return seeOther(req, "/list-your-sites/?error=send");
  }
}
