import { getPayload } from "payload";
import config from "@payload-config";
import { siteUrl } from "@/lib/hosting";
import {
  KitReadError,
  MAX_KIT_BYTES,
  kitName,
  kitReadingOn,
  planKit,
  readKit,
  type KitReport,
} from "@/lib/owners/kit-reading";
import { stateOf } from "@/lib/owners/progress";
import { saveSite, siteByRef, teamEmail } from "@/lib/owners/server";
import { SHEET_COLUMNS } from "@/lib/owners/sheet";
import type { FieldKey } from "@/lib/owners/site-input";
import { ownerFileBytes } from "@/lib/owners/stored-file";
import { indiaDate } from "@/lib/sites/calendar";
import { sendMail } from "@/lib/sites/mail";

/** A reading that started this long ago and never finished (the server stopped mid-way) is tried again. */
const STALE_MS = 30 * 60 * 1000;

const header = (k: FieldKey): string => SHEET_COLUMNS.find((c) => c.key === k)?.header ?? k;
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/**
 * Reads the oldest PDF media kit waiting for Claude, one a run: its sites become drafts in the owner's
 * list, and what could not be finished is kept for the owner's spreadsheet (/api/owner/kit/sheet/).
 * The team and the owner are each told what came of it. With no Anthropic key, kits wait, and the team
 * enters them by hand as before. Runs every ten minutes.
 */
export async function readMediaKits(now = Date.now()): Promise<{
  read: number;
  drafts: number;
  needs: number;
  waiting: number;
  off?: true;
  failed?: string;
}> {
  const payload = await getPayload({ config });
  const due = await payload.find({
    collection: "owner-files",
    where: {
      and: [
        { kind: { equals: "media_kit" } },
        {
          or: [
            { reading: { equals: "waiting" } },
            {
              and: [
                { reading: { equals: "reading" } },
                { readingAt: { less_than: new Date(now - STALE_MS).toISOString() } },
              ],
            },
          ],
        },
      ],
    },
    sort: "createdAt",
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const none = { read: 0, drafts: 0, needs: 0, waiting: due.totalDocs };
  if (!kitReadingOn()) return { ...none, off: true };
  const file = due.docs[0];
  if (!file) return none;

  const at = new Date(now).toISOString();
  await payload.update({
    collection: "owner-files",
    id: file.id,
    data: { reading: "reading", readingAt: at },
    overrideAccess: true,
  });
  const ownerId = typeof file.owner === "object" ? file.owner.id : file.owner;
  const owner = await payload.findByID({
    collection: "owners",
    id: ownerId,
    depth: 0,
    overrideAccess: true,
  });
  const today = indiaDate(now);
  const name = kitName(file.filename);
  const fileLink = `${siteUrl()}/admin/collections/owner-files/${file.id}`;

  let reading;
  try {
    if (file.mimeType !== "application/pdf")
      throw new KitReadError("Only PDF kits are read by Claude.");
    const bytes = await ownerFileBytes(payload, file);
    if (bytes.length > MAX_KIT_BYTES)
      throw new KitReadError("It is over 20 MB, more than Claude can be sent at once.");
    reading = await readKit(bytes, { ownerName: owner.name, note: file.note ?? null, today });
  } catch (error) {
    const why =
      error instanceof KitReadError
        ? error.message
        : "Something went wrong while reading it. The server log has the details.";
    if (!(error instanceof KitReadError)) console.error("media kit reading failed", error);
    await payload.update({
      collection: "owner-files",
      id: file.id,
      data: {
        reading: "failed",
        readingAt: new Date().toISOString(),
        readingNote: `Claude could not read it. ${why} Enter its sites by hand.`,
      },
      overrideAccess: true,
    });
    await sendMail({
      kind: "team_notice",
      to: teamEmail(),
      subject: `A media kit to enter by hand, from ${owner.name}`,
      text: [
        `Claude could not read ${name}, from ${owner.name}. ${why}`,
        "",
        `Open it: ${fileLink}`,
        "Enter each site as a draft under this owner. They check each one before it goes live.",
      ].join("\n"),
    }).catch(() => undefined);
    return { ...none, waiting: Math.max(0, none.waiting - 1), failed: why };
  }

  const plan = planKit(reading.sites, today);
  const report: KitReport = {
    model: reading.model,
    tokens: reading.tokens,
    found: reading.sites.length,
    drafts: [],
    needs: [...plan.needs],
    notes: reading.notes,
  };
  const adminLinks: string[] = [];
  for (const { page, raw, site, unsure } of plan.ready) {
    try {
      const existing = site.ownerRef ? await siteByRef(owner.id, site.ownerRef) : null;
      if (existing && stateOf(existing) === "live") {
        report.needs.push({
          page,
          raw,
          problems: {
            ownerRef: `“${site.ownerRef}” is already live. Change it from its own page instead.`,
          },
        });
        continue;
      }
      const note = [
        page ? `Page ${page} of the media kit.` : "From the media kit.",
        unsure.length ? `Check first: ${unsure.map(header).join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const saved = await saveSite(owner, site, "kit", existing, note);
      report.drafts.push({ page, id: saved.permanentId ?? "", title: saved.title ?? "" });
      adminLinks.push(`- ${saved.title}: ${siteUrl()}/admin/collections/sites/${saved.id}`);
    } catch (error) {
      report.needs.push({
        page,
        raw,
        problems: {
          ownerRef: error instanceof Error ? error.message : "This site could not be saved.",
        },
      });
    }
  }
  report.needs.sort((a, b) => a.page - b.page);

  const d = report.drafts.length;
  const n = report.needs.length;
  const summary = [
    `Claude found ${plural(report.found, "site")}. ${plural(d, "is a draft", "are drafts")} in the owner's list.${
      n
        ? ` ${plural(n, "needs", "need")} something from the owner first, most often the position; ${n === 1 ? "it is" : "they are"} in a spreadsheet on the owner's media kit page.`
        : ""
    }`,
    ...(reading.notes ? [`Claude's notes: ${reading.notes}`] : []),
    `${reading.model}: ${reading.tokens.input} tokens in, ${reading.tokens.output} out.`,
  ].join("\n\n");
  await payload.update({
    collection: "owner-files",
    id: file.id,
    data: {
      reading: "read",
      readingAt: new Date().toISOString(),
      readingNote: summary,
      report: report as unknown as Record<string, unknown>,
    },
    overrideAccess: true,
  });

  await sendMail({
    kind: "team_notice",
    to: teamEmail(),
    replyTo: owner.contactEmail,
    subject: `Claude read the media kit from ${owner.name}: ${plural(d, "draft")}`,
    text: [
      `Claude read ${name}, from ${owner.name}.`,
      "",
      summary,
      "",
      `The kit: ${fileLink}`,
      ...(adminLinks.length ? ["", "The drafts:", ...adminLinks] : []),
      "",
      "Check the drafts against the kit, then tick Done on the file. The owner checks each one too before it goes for review.",
    ].join("\n"),
  }).catch(() => undefined);
  const to = owner.loginEmail || owner.contactEmail;
  if (to && (d || n))
    await sendMail({
      kind: "owner_notice",
      to,
      subject: d
        ? `Your media kit is in your list: ${plural(d, "site")} to check`
        : "Your media kit: a few details only you know",
      text: [
        `We read your media kit, ${name}.`,
        "",
        ...(d
          ? [
              `${plural(d, "site is a draft", "sites are drafts")} in your list. We copied them from your file and left empty what it does not say. Check each one before you send it for review, the rate above all: ${siteUrl()}/owner/`,
            ]
          : []),
        ...(n
          ? [
              "",
              `${n === 1 ? `One${d ? " more" : ""} site needs` : `${n}${d ? " more" : ""} sites need`} something only you know, most often the exact position. Download ${n === 1 ? "it" : "them"} as a spreadsheet, already filled in from your kit, add what is marked, and upload it: ${siteUrl()}/owner/kit/`,
            ]
          : []),
      ].join("\n"),
    }).catch(() => undefined);
  return { read: 1, drafts: d, needs: n, waiting: Math.max(0, none.waiting - 1) };
}
