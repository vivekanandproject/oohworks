import { getPayload } from "payload";
import config from "@payload-config";
import { absolute } from "@/lib/seo";
import type { Enquiry, Message, Owner, Site } from "@/payload-types";
import {
  ANSWERS,
  ARTWORK,
  CODE_MINUTES,
  dateRange,
  hashCode,
  isPlanReference,
  medianReplyHours,
  newCode,
  newPlanReference,
  newReference,
  threadKey,
  type Answer,
  type Artwork,
} from "./enquiry";
import { sendMail } from "./mail";
import { inr, placeLine, siteUrl } from "./view";

export { ARTWORK, dateRange, type Artwork };

const NEUTRAL =
  "OOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients.";
const rupees = (n: number): string => inr(n).replace(/ /g, " ");

/** One request: what one buyer asked one owner, about one or more of that owner's sites. */
export interface Request {
  enquiry: Enquiry;
  sites: Site[];
  owner: Owner;
}

/**
 * Everything a buyer sent in one go. A single enquiry is a group of one. A buyer who asked several
 * owners at once has one request per owner, and each owner sees only their own.
 */
export interface Group {
  ref: string;
  plan: boolean;
  /** Carries the emailed code for the whole group. */
  lead: Enquiry;
  email: string;
  requests: Request[];
}

function toRequest(enquiry: Enquiry): Request | null {
  if (typeof enquiry.owner !== "object" || typeof enquiry.site !== "object") return null;
  const many = (enquiry.sites ?? []).filter((s): s is Site => typeof s === "object" && s !== null);
  return { enquiry, owner: enquiry.owner, sites: many.length ? many : [enquiry.site] };
}

/** A group by its reference: `ENQ-…` for one enquiry, `PLN-…` for several owners asked at once. Server-side only. */
export async function findGroup(ref: string): Promise<Group | null> {
  const payload = await getPayload({ config });
  const plan = isPlanReference(ref);
  const res = await payload.find({
    collection: "enquiries",
    where: plan ? { plan: { equals: ref } } : { reference: { equals: ref } },
    sort: "id",
    limit: 60,
    depth: 1,
    overrideAccess: true,
  });
  const requests = res.docs.map(toRequest).filter((r): r is Request => r !== null);
  const lead = requests.find((r) => r.enquiry.lead !== false)?.enquiry ?? requests[0]?.enquiry;
  if (!lead || requests.length === 0) return null;
  return { ref, plan, lead, email: lead.email, requests };
}

/** One request by its own reference. */
export async function findRequest(reference: string): Promise<Request | null> {
  const group = await findGroup(reference);
  return group && !group.plan ? (group.requests[0] ?? null) : null;
}

export interface NewRequests {
  /** One entry per owner, with that owner's sites. */
  items: { owner: Owner; sites: Site[] }[];
  email: string;
  from: string;
  to: string;
  brand: string;
  /** Sent only with an enquiry about one site. A buyer's budget for a whole shortlist is never passed on. */
  budget: number | null;
  artwork: Artwork;
  message: string;
}

/** Stores what the buyer asked, as one request per owner. Nothing is sent to anyone yet. */
export async function createRequests(input: NewRequests): Promise<Group> {
  const payload = await getPayload({ config });
  const plan = input.items.length > 1 ? newPlanReference() : null;
  let ref = plan ?? "";
  for (const [i, item] of input.items.entries()) {
    const first = item.sites[0];
    if (!first) continue;
    const reference = newReference();
    if (!plan) ref = reference;
    await payload.create({
      collection: "enquiries",
      overrideAccess: true,
      data: {
        reference,
        site: first.id,
        sites: item.sites.map((s) => s.id),
        owner: item.owner.id,
        email: input.email,
        dateFrom: input.from,
        dateTo: input.to,
        brand: input.brand,
        artwork: input.artwork,
        status: "pending",
        attempts: 0,
        lead: i === 0,
        ...(plan ? { plan } : {}),
        ...(input.budget && !plan ? { budget: input.budget } : {}),
        ...(input.message ? { message: input.message } : {}),
      },
    });
  }
  const group = await findGroup(ref);
  if (!group) throw new Error("The enquiry could not be stored.");
  return group;
}

/** How many times this address has started an enquiry in the last hour. Stops the form being used to flood someone with codes. */
export async function recentFrom(email: string, now: number): Promise<number> {
  const payload = await getPayload({ config });
  const res = await payload.count({
    collection: "enquiries",
    overrideAccess: true,
    where: {
      and: [
        { email: { equals: email } },
        { lead: { not_equals: false } },
        { createdAt: { greater_than: new Date(now - 3600_000).toISOString() } },
      ],
    },
  });
  return res.totalDocs;
}

const siteCount = (group: Group): number => group.requests.reduce((n, r) => n + r.sites.length, 0);

/** "20 × 10 ft hoarding, 80 Feet Road, Koramangala, Bengaluru", or "4 sites" for a shortlist. */
export function aboutText(group: Group): string {
  const only = group.requests.length === 1 ? group.requests[0] : undefined;
  const first = only?.sites.length === 1 ? only.sites[0] : undefined;
  return first ? `${first.title}, ${placeLine(first)}` : `${siteCount(group)} sites`;
}

export function toText(group: Group): string {
  const names = group.requests.map((r) => r.owner.name);
  return names.length === 1 ? (names[0] ?? "the owner") : `${names.length} owners`;
}

/** Emails a fresh six-digit code. Only its hash is kept, and it works for ten minutes. */
export async function issueCode(group: Group): Promise<void> {
  const payload = await getPayload({ config });
  const code = newCode();
  await payload.update({
    collection: "enquiries",
    id: group.lead.id,
    overrideAccess: true,
    data: {
      codeHash: hashCode(code, group.ref),
      codeExpiresAt: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
    },
  });
  await sendMail({
    kind: "code",
    to: group.email,
    subject: `${code} is your OOHWORKS code`,
    text: [
      `Your code is ${code}. It works for ${CODE_MINUTES} minutes.`,
      "",
      `Enter it to send your enquiry about ${aboutText(group)} straight to ${toText(group)}.`,
      "",
      "If you did not ask for this, ignore this email. Nothing is sent without the code.",
      "",
      NEUTRAL,
    ].join("\n"),
  });
}

async function contactOf(ownerId: number): Promise<string> {
  const payload = await getPayload({ config });
  const full = await payload.findByID({
    collection: "owners",
    id: ownerId,
    depth: 0,
    overrideAccess: true,
  });
  if (!full.contactEmail) throw new Error("This owner has no contact address.");
  return full.contactEmail;
}

const siteLines = (sites: Site[]): string[] =>
  sites.flatMap((s) => [
    `- ${s.title}, ${placeLine(s)}`,
    `  Unit ID ${s.permanentId} · ${absolute(siteUrl(s))}`,
  ]);
const replyLink = (reference: string): string =>
  absolute(`/reply/${reference}/?k=${threadKey(reference, "owner")}`);
export const threadPath = (ref: string): string =>
  `/enquiries/${ref}/?k=${threadKey(ref, "buyer")}`;

/**
 * Passes a confirmed group straight to its owners, one request each, and tells the buyer it went.
 * An owner is told about their own sites only. A request is marked sent once its owner's email has
 * been accepted, so a failure part-way can be tried again without anyone hearing twice.
 */
export async function deliverGroup(group: Group): Promise<void> {
  const payload = await getPayload({ config });
  const now = new Date().toISOString();
  for (const { enquiry, sites, owner } of group.requests) {
    if (enquiry.status !== "pending") continue;
    const dates = dateRange(enquiry.dateFrom, enquiry.dateTo);
    const one = sites.length === 1 ? sites[0] : undefined;
    await sendMail({
      kind: "owner_enquiry",
      to: await contactOf(owner.id),
      replyTo: enquiry.email,
      subject: `New enquiry: ${one ? one.title : `${sites.length} of your sites`} · ${dates}`,
      text: [
        one
          ? "A buyer has asked about your site on OOHWORKS."
          : `A buyer has asked about ${sites.length} of your sites on OOHWORKS.`,
        "",
        ...(one
          ? [
              `Site: ${one.title}, ${placeLine(one)}`,
              `Listing: ${absolute(siteUrl(one))}`,
              `Unit ID: ${one.permanentId}`,
            ]
          : ["Sites:", ...siteLines(sites)]),
        "",
        `Dates: ${dates}`,
        `Brand and category: ${enquiry.brand}`,
        ...(group.plan
          ? []
          : [`Budget: ${enquiry.budget ? `${rupees(enquiry.budget)} a month` : "Not given"}`]),
        `Artwork: ${ARTWORK[enquiry.artwork]}`,
        `Message: ${enquiry.message || "None"}`,
        "",
        `Answer in one step, with availability and your rate: ${replyLink(enquiry.reference)}`,
        `Or reply straight to the buyer: ${enquiry.email}`,
        "Their email address was confirmed with a code.",
        "",
        `Reference: ${enquiry.reference}`,
        "",
        "OOHWORKS never sells media or takes a media margin. You set the price and keep the client.",
      ].join("\n"),
    });
    await payload.update({
      collection: "enquiries",
      id: enquiry.id,
      overrideAccess: true,
      data: { status: "sent", verifiedAt: enquiry.verifiedAt ?? now, sentAt: now },
    });
  }
  await payload.update({
    collection: "enquiries",
    id: group.lead.id,
    overrideAccess: true,
    data: { codeHash: null, codeExpiresAt: null },
  });
  const dates = dateRange(group.lead.dateFrom, group.lead.dateTo);
  try {
    await sendMail({
      kind: "buyer_confirmation",
      to: group.email,
      subject: `Your enquiry went to ${toText(group)} · ${group.ref}`,
      text: [
        `Your enquiry about ${aboutText(group)} went straight to ${toText(group)}. ${group.requests.length === 1 ? "They reply" : "Each replies"} to this address.`,
        "",
        `Dates: ${dates}`,
        ...group.requests.flatMap((r) => [
          "",
          `${r.owner.name} · reference ${r.enquiry.reference}`,
          ...siteLines(r.sites),
        ]),
        "",
        `See the replies in one place: ${absolute(threadPath(group.ref))}`,
        "Keep this link to yourself: it opens your enquiry without a password.",
        "",
        "Contract, invoice and payment are between you and each owner. OOHWORKS charges nothing.",
        "",
        NEUTRAL,
      ].join("\n"),
    });
  } catch {
    // The owners already have the enquiry; a missed courtesy copy must not report it as unsent.
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
 * Local development only: a code that was kept in the outbox instead of sent (no email service, or an
 * address outside EMAIL_ALLOWLIST), read back so the flow can be walked through on one machine. Only
 * codes from the last ten minutes, the time a code works. Never available in production.
 */
export async function devCode(email: string): Promise<string | null> {
  if (process.env.NODE_ENV === "production") return null;
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "outbox",
    where: {
      and: [
        { to: { equals: email } },
        { kind: { equals: "code" } },
        { createdAt: { greater_than: new Date(Date.now() - 10 * 60_000).toISOString() } },
      ],
    },
    sort: "-createdAt",
    limit: 1,
    overrideAccess: true,
  });
  return res.docs[0]?.subject.match(/^\d{6}/)?.[0] ?? null;
}

/** The messages of each request, oldest first. */
export async function messagesOf(group: Group): Promise<Map<number, Message[]>> {
  const payload = await getPayload({ config });
  const ids = group.requests.map((r) => r.enquiry.id);
  const res = await payload.find({
    collection: "messages",
    where: { enquiry: { in: ids } },
    sort: "createdAt",
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  const out = new Map<number, Message[]>(ids.map((id) => [id, []]));
  for (const m of res.docs) {
    const id = typeof m.enquiry === "object" ? m.enquiry.id : m.enquiry;
    out.get(id)?.push(m);
  }
  return out;
}

export interface OwnerAnswer {
  siteId: number;
  availability: Answer | null;
  quote: number | null;
}

const answerLines = (request: Request, answers: OwnerAnswer[]): string[] =>
  answers.flatMap((a) => {
    const site = request.sites.find((s) => s.id === a.siteId);
    if (!site || (!a.availability && !a.quote)) return [];
    return [
      `- ${site.title}: ${[a.availability ? ANSWERS[a.availability] : null, a.quote ? `${rupees(a.quote)} a month` : null].filter(Boolean).join(" · ")}`,
    ];
  });

/**
 * An owner's reply. It is kept on the thread, emailed straight to the buyer, and the first one sets
 * how long this owner took to answer.
 */
export async function ownerReplies(
  request: Request,
  body: string,
  answers: OwnerAnswer[],
): Promise<void> {
  const payload = await getPayload({ config });
  const kept = answers
    .filter((a) => a.availability || a.quote)
    .filter((a) => request.sites.some((s) => s.id === a.siteId));
  await payload.create({
    collection: "messages",
    overrideAccess: true,
    data: {
      enquiry: request.enquiry.id,
      from: "owner",
      ...(body ? { body } : {}),
      answers: kept.map((a) => ({
        site: a.siteId,
        ...(a.availability ? { availability: a.availability } : {}),
        ...(a.quote ? { quote: a.quote } : {}),
      })),
    },
  });
  const first = !request.enquiry.repliedAt;
  if (first || request.enquiry.status === "sent") {
    await payload.update({
      collection: "enquiries",
      id: request.enquiry.id,
      overrideAccess: true,
      data: { status: "replied", ...(first ? { repliedAt: new Date().toISOString() } : {}) },
    });
  }
  if (first) await refreshReplyTime(request.owner.id);
  const groupRef = request.enquiry.plan || request.enquiry.reference;
  const lines = answerLines(request, kept);
  await sendMail({
    kind: "owner_reply",
    to: request.enquiry.email,
    replyTo: await contactOf(request.owner.id),
    subject: `${request.owner.name} replied · ${request.enquiry.reference}`,
    text: [
      `${request.owner.name} has replied to your enquiry of ${dateRange(request.enquiry.dateFrom, request.enquiry.dateTo)}.`,
      ...(lines.length ? ["", ...lines] : []),
      ...(body ? ["", body] : []),
      "",
      `See every reply in one place, or answer: ${absolute(threadPath(groupRef))}`,
      `You can also reply to this email; it goes straight to ${request.owner.name}.`,
      "",
      NEUTRAL,
    ].join("\n"),
  });
}

/** A buyer's follow-up to one owner. Kept on the thread and emailed straight to that owner. */
export async function buyerWrites(request: Request, body: string): Promise<void> {
  const payload = await getPayload({ config });
  await payload.create({
    collection: "messages",
    overrideAccess: true,
    data: { enquiry: request.enquiry.id, from: "buyer", body },
  });
  await sendMail({
    kind: "buyer_message",
    to: await contactOf(request.owner.id),
    replyTo: request.enquiry.email,
    subject: `The buyer wrote again · ${request.enquiry.reference}`,
    text: [
      `The buyer has written again about ${request.sites.length === 1 ? request.sites[0]?.title : `${request.sites.length} of your sites`}.`,
      "",
      body,
      "",
      `Answer here: ${replyLink(request.enquiry.reference)}`,
      `Or reply straight to the buyer: ${request.enquiry.email}`,
      "",
      "OOHWORKS never sells media or takes a media margin. You set the price and keep the client.",
    ].join("\n"),
  });
}

/** How many messages a buyer has added to one request in the last hour. */
export async function recentBuyerMessages(enquiryId: number, now: number): Promise<number> {
  const payload = await getPayload({ config });
  const res = await payload.count({
    collection: "messages",
    overrideAccess: true,
    where: {
      and: [
        { enquiry: { equals: enquiryId } },
        { from: { equals: "buyer" } },
        { createdAt: { greater_than: new Date(now - 3600_000).toISOString() } },
      ],
    },
  });
  return res.totalDocs;
}

/**
 * Works out an owner's median first-reply time from their answered enquiries, which is what earns
 * "Replies in under a day". Left as it is until there are enough answers to be fair.
 */
export async function refreshReplyTime(ownerId: number): Promise<number | null> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "enquiries",
    where: {
      and: [
        { owner: { equals: ownerId } },
        { repliedAt: { exists: true } },
        { sentAt: { exists: true } },
      ],
    },
    sort: "-repliedAt",
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  const median = medianReplyHours(
    res.docs.flatMap((e) =>
      e.sentAt && e.repliedAt ? [{ sentAt: e.sentAt, repliedAt: e.repliedAt }] : [],
    ),
  );
  if (median !== null)
    await payload.update({
      collection: "owners",
      id: ownerId,
      overrideAccess: true,
      data: { medianReplyHours: median },
    });
  return median;
}
