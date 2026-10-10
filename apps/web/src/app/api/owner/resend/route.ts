import { rateLimited, seeOther } from "@/lib/forms";
import { findCode, resendCode } from "@/lib/owners/server";
import { sameOrigin } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

/** Sends a new code, which replaces the old one. At most one every half minute. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const token = String(form.get("t") ?? "").trim();
  const via = form.get("via") === "signin" ? "&via=signin" : "";
  const back = (query: string) =>
    seeOther(req, `/list-your-sites/confirm/?t=${encodeURIComponent(token)}${via}&${query}`);
  if (rateLimited(req, "owner-resend", 5)) return back("error=busy");
  const row = await findCode(token);
  if (!row || row.usedAt) return seeOther(req, "/list-your-sites/?error=again");
  try {
    return back((await resendCode(row)) ? "resent=1" : "error=wait");
  } catch {
    return back("error=send");
  }
}
