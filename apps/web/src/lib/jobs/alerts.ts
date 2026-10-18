import { getPayload } from "payload";
import config from "@payload-config";
import type { Follow } from "@/payload-types";
import { emailLink } from "@/lib/email-links";
import { siteUrl } from "@/lib/hosting";
import { sendMail } from "@/lib/sites/mail";
import { matchingListings } from "@/lib/sites/queries";
import { readState, type SearchState } from "@/lib/sites/state";
import { formatDef, cityDef } from "@/lib/sites/taxonomy";
import { priceOf } from "@/lib/sites/view";

/** The most sites one alert names; the rest are a link away. */
const SHOWN = 10;
/** The most unit ids a follow remembers, so a very wide search cannot grow without end. */
const REMEMBERED = 2000;

/** The search a follow is about: its saved address, or the city and format it was made from. */
export function stateOfFollow(follow: Pick<Follow, "search" | "city" | "format">): SearchState {
  if (follow.search) {
    const params = new URL(follow.search, "http://local").searchParams;
    return readState(Object.fromEntries(params.entries())).state;
  }
  return readState({ city: follow.city ?? undefined, format: follow.format ?? undefined }).state;
}

/** Where a follow's sites are seen in full. */
export function searchAddress(follow: Pick<Follow, "search" | "city" | "format">): string {
  if (follow.search) return `${siteUrl()}${follow.search}`;
  const params = new URLSearchParams();
  if (follow.city) params.set("city", follow.city);
  if (follow.format) params.set("format", follow.format);
  const query = params.toString();
  return `${siteUrl()}/search/${query ? `?${query}` : ""}`;
}

/** What a follow is about, in words: "hoardings in Bengaluru". */
export function followWords(follow: Pick<Follow, "search" | "city" | "format">): string {
  const state = stateOfFollow(follow);
  const what =
    state.formats.length === 1
      ? (formatDef(state.formats[0])?.plural.toLowerCase() ?? "sites")
      : "sites";
  const where = state.city ? ` in ${cityDef(state.city)?.label ?? state.city}` : "";
  return `${what}${where}`;
}

/** The sites a follow matches now, as remembered: the start of what it has been told about. */
export async function currentIds(follow: Pick<Follow, "search" | "city" | "format">) {
  return (await matchingListings(stateOfFollow(follow)))
    .map((l) => l.permanentId)
    .slice(0, REMEMBERED);
}

/**
 * For each confirmed follow, the sites that match it now and that it has not been told about yet: one
 * email naming them, then they are remembered. Runs every hour.
 */
export async function sendAlerts(): Promise<{ follows: number; emailed: number }> {
  const payload = await getPayload({ config });
  const follows = (
    await payload.find({
      collection: "follows",
      where: { and: [{ confirmed: { equals: true } }, { unsubscribedAt: { exists: false } }] },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
  ).docs;
  let emailed = 0;
  for (const follow of follows) {
    const matches = await matchingListings(stateOfFollow(follow));
    const seen = new Set(Array.isArray(follow.seen) ? (follow.seen as string[]) : []);
    const fresh = matches.filter((l) => !seen.has(l.permanentId));
    if (fresh.length === 0) continue;
    const words = followWords(follow);
    const lines = fresh.slice(0, SHOWN).map((l) => {
      const price = priceOf({
        priceDisplay: l.priceShown ? (l.priceFrom ? "from" : "exact") : "on_request",
        rate: l.rate,
      });
      return `- ${l.title}, ${price.shown ? `${price.prefix}${price.amount} a month` : "price on request"}\n  ${siteUrl()}${l.url}`;
    });
    const more = fresh.length > SHOWN ? [`And ${fresh.length - SHOWN} more.`] : [];
    await sendMail({
      kind: "alert",
      to: follow.email,
      subject:
        fresh.length === 1
          ? `A new site: ${fresh[0]!.title}`
          : `${fresh.length} new ${words} on ohworks`,
      text: [
        `New ${words}, listed since we last wrote:`,
        "",
        ...lines,
        ...more,
        "",
        `See them all: ${searchAddress(follow)}`,
        "",
        "Every enquiry goes straight to the owner. ohworks never sells media.",
        `Stop these emails: ${emailLink("unfollow", follow.id)}`,
      ].join("\n"),
    });
    await payload.update({
      collection: "follows",
      id: follow.id,
      data: {
        seen: matches.map((l) => l.permanentId).slice(0, REMEMBERED),
        notifiedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    });
    emailed += 1;
  }
  return { follows: follows.length, emailed };
}
