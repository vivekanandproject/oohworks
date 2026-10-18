import { getPayload } from "payload";
import config from "@payload-config";
import { emailLink } from "@/lib/email-links";
import { sendMail } from "@/lib/sites/mail";
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
  const subscriber =
    existing.docs[0] ??
    (await payload.create({
      collection: "subscribers",
      data: {
        email,
        lists: ["daily"],
        source: safePath(form.get("from"), "/newsroom/").slice(0, 200),
      },
      overrideAccess: true,
    }));
  // The briefing goes only to an address whose owner opened this link.
  if (!subscriber.confirmed || subscriber.unsubscribedAt)
    await sendMail({
      kind: "confirm_email",
      to: email,
      subject: "Confirm: the ohworks daily briefing",
      text: [
        "Someone, we hope you, signed this address up for the ohworks daily briefing.",
        "",
        `Confirm with this link: ${emailLink("confirm-subscriber", subscriber.id)}`,
        "",
        "If it was not you, ignore this email. Nothing more will be sent.",
      ].join("\n"),
    }).catch(() => undefined);
  return seeOther(req, DONE);
}
