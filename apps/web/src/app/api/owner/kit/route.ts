import { absolute } from "@/lib/seo";
import { kitReadingOn } from "@/lib/owners/kit-reading";
import { fileOf, go, ownerGate, text } from "@/lib/owners/request";
import { saveOwnerFile, teamEmail } from "@/lib/owners/server";
import { sendMail } from "@/lib/sites/mail";

export const dynamic = "force-dynamic";

/**
 * A media kit for the team to enter. A PDF is first read by Claude into drafts (lib/jobs/media-kits),
 * when the Anthropic key is set. Nothing in it is published until the owner has checked the result.
 */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "kit", 10);
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  if (!owner) return go("/owner/company/");
  const picked = fileOf(form, "kit", "kit");
  if ("problem" in picked) return go(`/owner/kit/?error=${picked.problem}`);
  const note = text(form, "note", 1000) || null;
  const byClaude = kitReadingOn() && picked.file.type === "application/pdf";
  let saved;
  try {
    saved = await saveOwnerFile(
      owner,
      picked.file,
      "media_kit",
      note,
      undefined,
      byClaude ? "waiting" : undefined,
    );
  } catch {
    return go("/owner/kit/?error=read");
  }
  await sendMail({
    kind: "team_notice",
    to: teamEmail(),
    replyTo: owner.contactEmail,
    subject: `A media kit to enter, from ${owner.name}`,
    text: [
      `${owner.name} sent a media kit: ${picked.file.name}.`,
      ...(note ? ["", `Their note: ${note}`] : []),
      "",
      `Open it: ${absolute(`/admin/collections/owner-files/${saved.id}`)}`,
      byClaude
        ? "Claude reads it into drafts within the hour, and you get an email when it has. Check those drafts against the kit."
        : "Enter each site as a draft under this owner. They check each one before it goes live.",
    ].join("\n"),
  }).catch(() => undefined);
  return go("/owner/kit/?sent=1");
}
