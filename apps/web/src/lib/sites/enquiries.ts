import { getPayload } from "payload";
import config from "@payload-config";
import { absolute } from "@/lib/seo";
import type { Enquiry, Owner, Site } from "@/payload-types";
import {
  ARTWORK,
  CODE_MINUTES,
  dateRange,
  hashCode,
  newCode,
  newReference,
  type Artwork,
} from "./enquiry";

export { ARTWORK, dateRange, type Artwork };
import { emailConfigured, sendMail } from "./mail";
import { inr, placeLine, siteUrl } from "./view";

const NEUTRAL =
  "ohworks never sells media or takes a media margin. Owners set prices and keep their clients.";
export interface Found {
  enquiry: Enquiry;
  site: Site;
  owner: Owner;
}

/** An enquiry by its reference, with its site and owner. Server-side only: it carries the buyer's address. */
export async function findEnquiry(reference: string): Promise<Found | null> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "enquiries",
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  });
  const enquiry = res.docs[0];
  if (!enquiry || typeof enquiry.site !== "object" || typeof enquiry.owner !== "object")
    return null;
  return { enquiry, site: enquiry.site, owner: enquiry.owner };
}

export interface NewEnquiry {
  site: Site;
  owner: Owner;
  email: string;
  from: string;
  to: string;
  brand: string;
  budget: number | null;
  artwork: Artwork;
  message: string;
}

export async function createEnquiry(input: NewEnquiry): Promise<Enquiry> {
  const payload = await getPayload({ config });
  return payload.create({
    collection: "enquiries",
    overrideAccess: true,
    data: {
      reference: newReference(),
      site: input.site.id,
      owner: input.owner.id,
      email: input.email,
      dateFrom: input.from,
      dateTo: input.to,
      brand: input.brand,
      artwork: input.artwork,
      status: "pending",
      attempts: 0,
      ...(input.budget ? { budget: input.budget } : {}),
      ...(input.message ? { message: input.message } : {}),
    },
  });
}

/** How many enquiries this address has started in the last hour. Stops the form being used to flood someone with codes. */
export async function recentFrom(email: string, now: number): Promise<number> {
  const payload = await getPayload({ config });
  const res = await payload.count({
    collection: "enquiries",
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

/** Emails a fresh six-digit code. Only its hash is kept, and it works for ten minutes. */
export async function issueCode({ enquiry, site, owner }: Found): Promise<void> {
  const payload = await getPayload({ config });
  const code = newCode();
  await payload.update({
    collection: "enquiries",
    id: enquiry.id,
    overrideAccess: true,
    data: {
      codeHash: hashCode(code, enquiry.reference),
      codeExpiresAt: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
    },
  });
  await sendMail({
    kind: "code",
    to: enquiry.email,
    subject: `${code} is your ohworks code`,
    text: [
      `Your code is ${code}. It works for ${CODE_MINUTES} minutes.`,
      "",
      `Enter it to send your enquiry about ${site.title}, ${placeLine(site)}, straight to ${owner.name}.`,
      "",
      "If you did not ask for this, ignore this email. Nothing is sent without the code.",
      "",
      NEUTRAL,
    ].join("\n"),
  });
}

/**
 * Passes a confirmed enquiry straight to the owner and tells the buyer it went. The owner replies to
 * the buyer directly. Marks the enquiry sent only once the owner's email has been accepted.
 */
export async function deliver({ enquiry, site, owner }: Found): Promise<void> {
  const payload = await getPayload({ config });
  const full = await payload.findByID({
    collection: "owners",
    id: owner.id,
    depth: 0,
    overrideAccess: true,
  });
  if (!full.contactEmail) throw new Error("This owner has no contact address.");
  const dates = dateRange(enquiry.dateFrom, enquiry.dateTo);
  const listing = absolute(siteUrl(site));
  await sendMail({
    kind: "owner_enquiry",
    to: full.contactEmail,
    replyTo: enquiry.email,
    subject: `New enquiry: ${site.title} · ${dates}`,
    text: [
      "A buyer has asked about your site on ohworks.",
      "",
      `Site: ${site.title}, ${placeLine(site)}`,
      `Listing: ${listing}`,
      `Unit ID: ${site.permanentId}`,
      "",
      `Dates: ${dates}`,
      `Brand and category: ${enquiry.brand}`,
      `Budget: ${enquiry.budget ? `${inr(enquiry.budget).replace(/\u00a0/g, " ")} a month` : "Not given"}`,
      `Artwork: ${ARTWORK[enquiry.artwork]}`,
      `Message: ${enquiry.message || "None"}`,
      "",
      `Reply straight to the buyer: ${enquiry.email}`,
      "Their email address was confirmed with a code.",
      "",
      `Reference: ${enquiry.reference}`,
      "",
      "ohworks never sells media or takes a media margin. You set the price and keep the client.",
    ].join("\n"),
  });
  const now = new Date().toISOString();
  await payload.update({
    collection: "enquiries",
    id: enquiry.id,
    overrideAccess: true,
    data: {
      status: "sent",
      verifiedAt: enquiry.verifiedAt ?? now,
      sentAt: now,
      codeHash: null,
      codeExpiresAt: null,
    },
  });
  try {
    await sendMail({
      kind: "buyer_confirmation",
      to: enquiry.email,
      subject: `Your enquiry went to ${owner.name} · ${enquiry.reference}`,
      text: [
        `Your enquiry about ${site.title}, ${placeLine(site)}, went straight to ${owner.name}. They reply to this address.`,
        "",
        `Dates: ${dates}`,
        `Reference: ${enquiry.reference}`,
        `Listing: ${listing}`,
        "",
        "Contract, invoice and payment are between you and the owner. ohworks charges nothing.",
        "",
        NEUTRAL,
      ].join("\n"),
    });
  } catch {
    // The owner already has the enquiry; a missed courtesy copy must not report it as unsent.
  }
}

/** Marks a wrong code. */
export async function countAttempt(enquiry: Enquiry): Promise<void> {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "enquiries",
    id: enquiry.id,
    overrideAccess: true,
    data: { attempts: (enquiry.attempts ?? 0) + 1 },
  });
}

/**
 * Local development only: with no email service, the last code sent to an address, read back from the
 * outbox so the flow can be walked through on one machine. Never available in production.
 */
export async function devCode(email: string): Promise<string | null> {
  if (emailConfigured() || process.env.NODE_ENV === "production") return null;
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "outbox",
    where: { and: [{ to: { equals: email } }, { kind: { equals: "code" } }] },
    sort: "-createdAt",
    limit: 1,
    overrideAccess: true,
  });
  return res.docs[0]?.subject.match(/^\d{6}/)?.[0] ?? null;
}
