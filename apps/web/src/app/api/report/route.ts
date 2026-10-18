import { getPayload } from "payload";
import config from "@payload-config";
import {
  REPORT_REASONS,
  REPORT_RESPOND_HOURS,
  type ReportReason,
} from "@/payload/collections/ListingReports";
import { cleanEmail, rateLimited, safePath, seeOther } from "@/lib/forms";
import { teamEmail } from "@/lib/owners/server";
import { absolute } from "@/lib/seo";
import { sameOrigin } from "@/lib/sites/enquiry";
import { sendMail } from "@/lib/sites/mail";

export const dynamic = "force-dynamic";

const REASONS = REPORT_REASONS.map((r) => r.value) as readonly string[];

/** Where to send the browser back to: the site page, at the report form, with how it went. */
function back(path: string, result: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.delete("reported");
  url.searchParams.delete("report");
  url.searchParams.set(result === "ok" ? "reported" : "report", result === "ok" ? "1" : result);
  return `${url.pathname}${url.search}#report`;
}

/**
 * A report about a listing, from the form at the foot of every site page. Works without JavaScript.
 * Stored for the team, who are emailed, and answered within two days.
 */
export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const page = safePath(form.get("return"), "/search/");

  // A filled trap field or too many reports from one address: thanked, and nothing stored.
  if (String(form.get("website") ?? "").trim()) return seeOther(req, back(page, "ok"));
  if (rateLimited(req, "report", 10)) return seeOther(req, back(page, "ok"));

  const reason = String(form.get("reason") ?? "");
  if (!REASONS.includes(reason)) return seeOther(req, back(page, "reason"));
  const message = String(form.get("message") ?? "")
    .trim()
    .slice(0, 2000);
  const given = String(form.get("email") ?? "").trim();
  const email = given ? cleanEmail(given) : null;
  if (given && !email) return seeOther(req, back(page, "email"));

  const unitId = String(form.get("id") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 40);
  const payload = await getPayload({ config });
  const site = unitId
    ? (
        await payload.find({
          collection: "sites",
          where: { permanentId: { equals: unitId } },
          limit: 1,
          depth: 0,
          overrideAccess: false,
        })
      ).docs[0]
    : undefined;
  if (!site) return seeOther(req, back(page, "site"));

  const report = await payload.create({
    collection: "listing-reports",
    overrideAccess: true,
    data: {
      site: site.id,
      unitId,
      reason: reason as ReportReason,
      ...(message ? { message } : {}),
      ...(email ? { email } : {}),
      status: "new",
      respondBy: new Date(Date.now() + REPORT_RESPOND_HOURS * 3600_000).toISOString(),
    },
  });

  const label = REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
  await sendMail({
    kind: "team_notice",
    to: teamEmail(),
    ...(email ? { replyTo: email } : {}),
    subject: `A report about ${unitId}: ${label}`,
    text: [
      `Someone reported ${site.title ?? unitId}.`,
      `Reason: ${label}`,
      ...(message ? ["", message] : []),
      "",
      email ? `They would like to hear back: ${email}` : "They did not leave an address.",
      "",
      `The report: ${absolute(`/admin/collections/listing-reports/${report.id}`)}`,
      `The site: ${absolute(`/admin/collections/sites/${site.id}`)}`,
      "Answer within two days.",
    ].join("\n"),
  }).catch(() => undefined);

  return seeOther(req, back(page, "ok"));
}
