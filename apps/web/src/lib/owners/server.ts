import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { formatDate } from "@/lib/editorial/format";
import { absolute } from "@/lib/seo";
import { indiaDate } from "@/lib/sites/calendar";
import {
  CODE_MINUTES,
  MAX_ATTEMPTS,
  OWNER_COOKIE,
  hashCode,
  newCode,
  readEmail,
  sameHash,
} from "@/lib/sites/enquiry";
import { sendMail } from "@/lib/sites/mail";
import { formatDef, type CitySlug } from "@/lib/sites/taxonomy";
import type { AccessCode, Media, Owner, OwnerFile, Site } from "@/payload-types";
import { metresBetween, sameFace } from "./coords";
import { freeSlug, stateOf } from "./progress";
import { toSiteData, type SiteInput } from "./site-input";

const NEUTRAL =
  "Listing on ohworks is free. ohworks never sells media or takes a media margin. You set the price and keep the client.";
const client = () => getPayload({ config });
export const teamEmail = (): string => process.env.OPS_EMAIL || "owners@ohworks.com";

/** The email this browser has confirmed as an owner's, or null. */
export async function ownerEmail(): Promise<string | null> {
  return readEmail("owner", (await cookies()).get(OWNER_COOKIE)?.value);
}

export async function ownerByEmail(email: string): Promise<Owner | null> {
  const res = await (
    await client()
  ).find({
    collection: "owners",
    where: { loginEmail: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return res.docs[0] ?? null;
}

/** For a page only a signed-in owner may see. Anyone else is sent to the start. */
export async function requireEmail(): Promise<{ email: string; owner: Owner | null }> {
  const email = await ownerEmail();
  if (!email) redirect("/list-your-sites/");
  return { email, owner: await ownerByEmail(email) };
}

/** For a page that needs the company to exist. An owner who has not given it yet is sent to do that first. */
export async function requireOwner(): Promise<{ email: string; owner: Owner }> {
  const { email, owner } = await requireEmail();
  if (!owner) redirect("/owner/company/");
  return { email, owner };
}

/* Codes ------------------------------------------------------------------------------------------ */

async function mailCode(email: string, code: string): Promise<void> {
  await sendMail({
    kind: "owner_code",
    to: email,
    subject: `${code} is your ohworks code`,
    text: [
      `Your code is ${code}. It works for ${CODE_MINUTES} minutes.`,
      "",
      "Enter it to list and manage your sites on ohworks.",
      "",
      "If you did not ask for this, ignore this email. Nothing happens without the code.",
      "",
      NEUTRAL,
    ].join("\n"),
  });
}

/** Emails a six-digit code and returns the token that names this attempt. Only the code's hash is kept. */
export async function startCode(email: string): Promise<string> {
  const token = randomBytes(12).toString("hex");
  const code = newCode();
  await (
    await client()
  ).create({
    collection: "access-codes",
    overrideAccess: true,
    data: {
      email,
      token,
      codeHash: hashCode(code, token),
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
    },
  });
  await mailCode(email, code);
  return token;
}

export async function findCode(token: string): Promise<AccessCode | null> {
  if (!/^[0-9a-f]{24}$/.test(token)) return null;
  const res = await (
    await client()
  ).find({
    collection: "access-codes",
    where: { token: { equals: token } },
    limit: 1,
    overrideAccess: true,
  });
  return res.docs[0] ?? null;
}

export async function recentCodes(email: string, now: number): Promise<number> {
  const res = await (
    await client()
  ).count({
    collection: "access-codes",
    overrideAccess: true,
    where: {
      and: [
        { email: { equals: email } },
        { createdAt: { greater_than: new Date(now - 3600_000).toISOString() } },
      ],
    },
  });
  return res.totalDocs;
}

export type CodeResult =
  { ok: true; email: string } | { ok: false; why: "wrong" | "expired" | "locked" | "missing" };

export async function checkCode(token: string, code: string): Promise<CodeResult> {
  const payload = await client();
  const row = await findCode(token);
  if (!row || row.usedAt) return { ok: false, why: "missing" };
  if (new Date(row.expiresAt).getTime() < Date.now()) return { ok: false, why: "expired" };
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) return { ok: false, why: "locked" };
  if (code.length !== 6 || !sameHash(hashCode(code, token), row.codeHash)) {
    await payload.update({
      collection: "access-codes",
      id: row.id,
      overrideAccess: true,
      data: { attempts: (row.attempts ?? 0) + 1 },
    });
    return { ok: false, why: (row.attempts ?? 0) + 1 >= MAX_ATTEMPTS ? "locked" : "wrong" };
  }
  await payload.update({
    collection: "access-codes",
    id: row.id,
    overrideAccess: true,
    data: { usedAt: new Date().toISOString() },
  });
  return { ok: true, email: row.email };
}

/** Replaces the code on an attempt with a fresh one. Returns false if one was sent in the last half minute. */
export async function resendCode(row: AccessCode): Promise<boolean> {
  if (Date.now() - new Date(row.updatedAt).getTime() < 30_000) return false;
  const code = newCode();
  await (
    await client()
  ).update({
    collection: "access-codes",
    id: row.id,
    overrideAccess: true,
    data: {
      codeHash: hashCode(code, row.token),
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
    },
  });
  await mailCode(row.email, code);
  return true;
}

/* Company ---------------------------------------------------------------------------------------- */

export interface CompanyInput {
  name: string;
  city: CitySlug | null;
  contactName: string;
  phone: string;
  contactEmail: string;
  about: string | null;
  gstin: string | null;
}

const slugOf = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export async function saveCompany(email: string, input: CompanyInput): Promise<Owner> {
  const payload = await client();
  const existing = await ownerByEmail(email);
  const data = {
    name: input.name,
    city: input.city,
    contactName: input.contactName,
    phone: input.phone,
    contactEmail: input.contactEmail,
    about: input.about,
    gstin: input.gstin,
  };
  if (existing)
    return payload.update({ collection: "owners", id: existing.id, data, overrideAccess: true });
  const all = await payload.find({
    collection: "owners",
    pagination: false,
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  });
  const taken = new Set(all.docs.map((o) => o.slug));
  return payload.create({
    collection: "owners",
    overrideAccess: true,
    data: {
      ...data,
      slug: freeSlug(slugOf(input.name), (s) => taken.has(s)),
      loginEmail: email,
      source: "self",
      verified: false,
      sample: false,
    },
  });
}

/** A private file from an owner: a document, a spreadsheet or a media kit. Only staff can open it. */
export async function saveOwnerFile(
  owner: Owner,
  file: File,
  kind: OwnerFile["kind"],
  note: string | null,
  report?: unknown,
): Promise<OwnerFile> {
  const data = Buffer.from(await file.arrayBuffer());
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80) || "file";
  return (await client()).create({
    collection: "owner-files",
    overrideAccess: true,
    data: {
      owner: owner.id,
      kind,
      handled: false,
      ...(note ? { note } : {}),
      ...(report !== undefined ? { report: report as Record<string, unknown> } : {}),
    },
    file: {
      data,
      mimetype: file.type || "application/octet-stream",
      name: `${owner.slug ?? owner.id}-${Date.now()}-${safe}`,
      size: data.length,
    },
  });
}

export async function ownerFiles(ownerId: number, kind?: OwnerFile["kind"]): Promise<OwnerFile[]> {
  const res = await (
    await client()
  ).find({
    collection: "owner-files",
    where: { and: [{ owner: { equals: ownerId } }, ...(kind ? [{ kind: { equals: kind } }] : [])] },
    sort: "-createdAt",
    limit: 50,
    depth: 0,
    overrideAccess: true,
  });
  return res.docs;
}

export async function ownerFile(ownerId: number, id: number): Promise<OwnerFile | null> {
  const res = await (
    await client()
  ).find({
    collection: "owner-files",
    where: { and: [{ owner: { equals: ownerId } }, { id: { equals: id } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return res.docs[0] ?? null;
}

/* Sites ------------------------------------------------------------------------------------------ */

/** Every site of one owner, whatever its state, newest first. Drafts are theirs alone to see. */
export async function ownerSites(ownerId: number): Promise<Site[]> {
  const res = await (
    await client()
  ).find({
    collection: "sites",
    where: { owner: { equals: ownerId } },
    draft: true,
    sort: "-updatedAt",
    pagination: false,
    limit: 2000,
    depth: 1,
    overrideAccess: true,
  });
  return res.docs;
}

/** One site, only if it belongs to this owner. */
export async function ownerSite(ownerId: number, permanentId: string): Promise<Site | null> {
  const res = await (
    await client()
  ).find({
    collection: "sites",
    where: { and: [{ owner: { equals: ownerId } }, { permanentId: { equals: permanentId } }] },
    draft: true,
    limit: 1,
    depth: 2,
    overrideAccess: true,
  });
  return res.docs[0] ?? null;
}

/** A note for the owner and the team when another listed site is probably the same face. */
export async function duplicateNote(
  at: { lat: number; lng: number; facingDeg: number | null },
  exceptId?: number,
): Promise<string | null> {
  const pad = 0.0004; // about 44 m of latitude: wide enough to hold every candidate within 25 m
  const res = await (
    await client()
  ).find({
    collection: "sites",
    draft: true,
    overrideAccess: true,
    depth: 1,
    limit: 20,
    where: {
      and: [
        { lat: { greater_than_equal: at.lat - pad } },
        { lat: { less_than_equal: at.lat + pad } },
        { lng: { greater_than_equal: at.lng - pad } },
        { lng: { less_than_equal: at.lng + pad } },
      ],
    },
  });
  const hit = res.docs.find((s) => s.id !== exceptId && !s.removed && sameFace(at, s));
  if (!hit) return null;
  const by = typeof hit.owner === "object" ? hit.owner.name : "another owner";
  return `Possible duplicate of ${hit.permanentId} (${hit.title}), ${Math.round(metresBetween(at, hit))} m away, listed by ${by}`;
}

/**
 * Saves a checked site for an owner, as a draft only they can see. A live site is never changed this
 * way: what a site is and where it is are what the badges vouch for.
 */
export async function saveSite(
  owner: Owner,
  input: SiteInput,
  source: "form" | "sheet",
  existing?: Site | null,
): Promise<Site> {
  const payload = await client();
  const today = indiaDate(Date.now());
  const note = await duplicateNote(input, existing?.id);
  const data = {
    ...toSiteData(input, today),
    owner: owner.id,
    duplicateNote: note,
    _status: "draft" as const,
  };
  if (existing) {
    if (stateOf(existing) === "live") throw new Error("A live site is changed from its own page.");
    return payload.update({
      collection: "sites",
      id: existing.id,
      data: { ...data, review: existing.review === "changes" ? "changes" : "draft" },
      draft: true,
      overrideAccess: true,
    });
  }
  return payload.create({
    collection: "sites",
    data: { ...data, source, review: "draft", sample: false, removed: false, photos: [] },
    draft: true,
    overrideAccess: true,
  });
}

export async function siteByRef(ownerId: number, ownerRef: string): Promise<Site | null> {
  const res = await (
    await client()
  ).find({
    collection: "sites",
    where: { and: [{ owner: { equals: ownerId } }, { ownerRef: { equals: ownerRef } }] },
    draft: true,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return res.docs[0] ?? null;
}

const KIND_WORD = { approach: "Approach view", day: "Day view", night: "Night view" } as const;
export const MAX_PHOTOS = 6;

/** Adds a photograph to a site. It is stored as the owner's own, credited to them. */
export async function addPhoto(
  owner: Owner,
  site: Site,
  file: File,
  kind: keyof typeof KIND_WORD,
  takenOn: string,
): Promise<void> {
  const payload = await client();
  const data = Buffer.from(await file.arrayBuffer());
  const media = await payload.create({
    collection: "media",
    overrideAccess: true,
    data: {
      alt: `${KIND_WORD[kind]} of the ${formatDef(site.format)?.inSentence ?? "site"} on ${site.road}, ${site.locality}`,
      credit: owner.name,
      licence: "press",
      takenAt: takenOn,
    },
    file: {
      data,
      mimetype: file.type,
      name: `${site.permanentId}-${kind}-${Date.now()}.${file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"}`,
      size: data.length,
    },
  });
  const photos = [
    ...(site.photos ?? []).map((p) => ({
      image: typeof p.image === "object" ? p.image.id : p.image,
      kind: p.kind,
      takenOn: p.takenOn,
      gps: Boolean(p.gps),
    })),
    { image: media.id, kind, takenOn, gps: false },
  ];
  // The approach view leads, as it does on every card.
  photos.sort((a, b) => Number(b.kind === "approach") - Number(a.kind === "approach"));
  await payload.update({
    collection: "sites",
    id: site.id,
    data: { photos },
    draft: stateOf(site) !== "live",
    overrideAccess: true,
  });
}

export async function removePhoto(site: Site, mediaId: number): Promise<void> {
  const payload = await client();
  const kept = (site.photos ?? []).filter(
    (p) => (typeof p.image === "object" ? p.image.id : p.image) !== mediaId,
  );
  if (kept.length === (site.photos ?? []).length) return;
  await payload.update({
    collection: "sites",
    id: site.id,
    data: {
      photos: kept.map((p) => ({
        image: typeof p.image === "object" ? p.image.id : p.image,
        kind: p.kind,
        takenOn: p.takenOn,
        gps: Boolean(p.gps),
      })),
    },
    draft: stateOf(site) !== "live",
    overrideAccess: true,
  });
  await payload
    .delete({ collection: "media", id: mediaId, overrideAccess: true })
    .catch(() => undefined);
}

/** Removes a site that has never been live. A live site is withdrawn instead, which keeps its record. */
export async function removeDraft(site: Site): Promise<void> {
  if (stateOf(site) === "live") throw new Error("A live site is withdrawn, not removed.");
  await (await client()).delete({ collection: "sites", id: site.id, overrideAccess: true });
}

/** Takes a live site off ohworks at its owner's word. It returns to a draft and can be sent for review again. */
export async function withdraw(site: Site): Promise<void> {
  await (
    await client()
  ).update({
    collection: "sites",
    id: site.id,
    data: { _status: "draft", review: "draft" },
    overrideAccess: true,
  });
}

export interface Quick {
  priceDisplay: Site["priceDisplay"];
  rate: number | null;
  /** A date when booked, or null when the owner says it is free now. */
  bookedUntil: string | null;
}

/** The owner's own facts on a live site, changed at once: the price, how it shows, and availability. */
export async function quickUpdate(site: Site, change: Quick): Promise<void> {
  await (
    await client()
  ).update({
    collection: "sites",
    id: site.id,
    overrideAccess: true,
    data: {
      priceDisplay: change.priceDisplay,
      rate: change.rate,
      bookedUntil: change.bookedUntil,
      availabilityConfirmedOn: indiaDate(Date.now()),
    },
  });
}

/** Sends every draft and returned site for review, and tells the team and the owner. Returns how many went. */
export async function submitAll(owner: Owner): Promise<number> {
  const payload = await client();
  const waiting = (await ownerSites(owner.id)).filter((s) =>
    ["draft", "changes"].includes(stateOf(s)),
  );
  if (waiting.length === 0) return 0;
  const now = new Date().toISOString();
  for (const s of waiting)
    await payload.update({
      collection: "sites",
      id: s.id,
      data: { review: "submitted", submittedAt: now },
      draft: true,
      overrideAccess: true,
    });
  if (!owner.submittedAt)
    await payload.update({
      collection: "owners",
      id: owner.id,
      data: { submittedAt: now },
      overrideAccess: true,
    });
  const n = waiting.length === 1 ? "1 site" : `${waiting.length} sites`;
  const flagged = waiting.filter((s) => s.duplicateNote).length;
  await sendMail({
    kind: "team_notice",
    to: teamEmail(),
    replyTo: owner.contactEmail,
    subject: `${n} to review from ${owner.name}`,
    text: [
      `${owner.name} sent ${n} for review on ${formatDate(now)}.`,
      "",
      ...waiting.map(
        (s) =>
          `- ${s.title}, ${s.locality} · ${s.permanentId}${s.duplicateNote ? " · possible duplicate" : ""}`,
      ),
      "",
      `Owner verified: ${owner.verified ? "yes" : "no"}${owner.gstin ? ` · GSTIN ${owner.gstin}` : " · no GSTIN given"}`,
      ...(flagged ? [`${flagged} flagged as a possible duplicate.`] : []),
      "",
      `Review them: ${absolute("/admin/collections/sites?where[review][equals]=submitted")}`,
    ].join("\n"),
  });
  await sendMail({
    kind: "owner_notice",
    to: owner.loginEmail ?? owner.contactEmail,
    subject: `We have your ${n} for review`,
    text: [
      `Thank you. ${waiting.length === 1 ? "Your site is" : `Your ${waiting.length} sites are`} with the ohworks team.`,
      "",
      "We check the owner, the location and the photographs of each one before it goes live, usually within a working day. You will get an email for each site, saying it is live or what to fix.",
      "",
      `See where each one stands: ${absolute("/owner/")}`,
      "",
      NEUTRAL,
    ].join("\n"),
  });
  return waiting.length;
}

export function photoOf(p: NonNullable<Site["photos"]>[number]): Media | null {
  return typeof p.image === "object" ? p.image : null;
}

/**
 * Local development only: with no email service, the last code sent to an owner, read back from the
 * outbox so the flow can be walked through on one machine. Never available in production.
 */
export async function devOwnerCode(email: string): Promise<string | null> {
  if (process.env.RESEND_API_KEY || process.env.NODE_ENV === "production") return null;
  const res = await (
    await client()
  ).find({
    collection: "outbox",
    where: { and: [{ to: { equals: email } }, { kind: { equals: "owner_code" } }] },
    sort: "-createdAt",
    limit: 1,
    overrideAccess: true,
  });
  return res.docs[0]?.subject.match(/^\d{6}/)?.[0] ?? null;
}
