import type { Owner, Site } from "@/payload-types";
import { formatDate } from "@/lib/editorial/format";
import { absolute } from "@/lib/seo";
import { formatDef, lightingDef, cityName } from "./taxonomy";
import {
  availabilityOf,
  badgesOf,
  coords,
  facingText,
  priceOf,
  sizeFull,
  siteUrl,
  summaryOf,
} from "./view";

const yaml = (value: string | number | null | undefined): string => JSON.stringify(value ?? null);

/**
 * A site's page as Markdown, for AI agents planning a campaign for someone: every fact the page
 * shows, with units, sources and dates, the checks it has passed, and how to ask the owner. The
 * contact details of the owner are never in it; enquiries go through the page, as on the site.
 */
export function siteMarkdown(
  site: Site,
  owner: Pick<Owner, "name" | "slug" | "verified" | "medianReplyHours"> | null,
  photos: string[],
  now: number,
): string {
  const url = absolute(siteUrl(site));
  const city = cityName(site.city, site.cityLabel);
  const format = formatDef(site.format)?.label ?? site.format;
  const lit = lightingDef(site.lighting)?.label ?? null;
  const price = priceOf(site);
  const availability = availabilityOf(site, now);
  const checks = badgesOf(site, owner, now).filter((b) => b.kind !== "neutral");
  const audience =
    site.audience?.figure && site.audience.source && site.audience.measuredOn
      ? site.audience
      : null;
  const digital = site.digital;
  const enquire = absolute(`/enquire/${site.permanentId}/`);

  const header = [
    "---",
    `unit_id: ${yaml(site.permanentId)}`,
    `title: ${yaml(site.title)}`,
    `url: ${yaml(url)}`,
    `format: ${yaml(format)}`,
    `city: ${yaml(city)}`,
    `locality: ${yaml(site.locality)}`,
    `road: ${yaml(site.road)}`,
    `latitude: ${Number(site.lat.toFixed(5))}`,
    `longitude: ${Number(site.lng.toFixed(5))}`,
    ...(site.facingDeg != null ? [`facing_degrees: ${Math.round(site.facingDeg)}`] : []),
    `width_mm: ${yaml(site.widthMm)}`,
    `height_mm: ${yaml(site.heightMm)}`,
    `lighting: ${yaml(lit)}`,
    `price_inr_per_month: ${price.shown ? yaml(site.rate) : "null"}`,
    `price_display: ${yaml(site.priceDisplay)}`,
    `availability: ${yaml(availability.label)}`,
    `owner: ${yaml(owner?.name ?? null)}`,
    `updated: ${yaml(site.updatedAt)}`,
    "listed_on: OOHWORKS",
    "---",
  ].join("\n");

  const facts: [string, string | null][] = [
    ["Format", format],
    ["Size", sizeFull(site)],
    ["Lighting", lit],
    [
      "Place",
      `${site.road}, ${site.locality}, ${city}${site.landmark ? ` (${site.landmark})` : ""}`,
    ],
    ["Coordinates", coords(site.lat, site.lng)],
    ["Facing", facingText(site.facingDeg)],
    ["Traffic", site.trafficDirection ? `Towards ${site.trafficDirection}` : null],
    ["Height above the road", site.heightAboveRoadM ? `${site.heightAboveRoadM} m` : null],
    [
      "Price",
      price.shown
        ? `${price.prefix}${price.amount} a month, set by the owner${site.minPeriod ? `; minimum ${site.minPeriod}` : ""}`
        : "On request: ask the owner",
    ],
    ["Production cost", site.productionCost ? String(site.productionCost) : null],
    ["Availability", `${availability.label}${availability.note ? `. ${availability.note}` : ""}`],
    [
      "Audience",
      audience
        ? `${audience.figure}${audience.metric ? ` ${audience.metric}` : ""} (source: ${audience.source}, measured ${formatDate(audience.measuredOn)}${audience.method ? `, ${audience.method}` : ""})`
        : null,
    ],
    [
      "Permit",
      site.permit?.number
        ? `${site.permit.number}${site.permit.authority ? `, ${site.permit.authority}` : ""}${site.permit.expiresOn ? `, expires ${formatDate(site.permit.expiresOn)}` : ""}`
        : null,
    ],
    ["Screen", digital?.resolution ? `${digital.resolution}` : null],
    ["Spot length", digital?.spotSeconds ? `${digital.spotSeconds} s` : null],
    ["Loop length", digital?.loopSeconds ? `${digital.loopSeconds} s` : null],
    ["Last verified", site.lastVerifiedOn ? formatDate(site.lastVerifiedOn) : null],
  ];

  const parts = [
    header,
    `# ${site.title}`,
    summaryOf(site, owner),
    "## Facts",
    facts
      .filter((f): f is [string, string] => Boolean(f[1]))
      .map(([k, v]) => `- **${k}:** ${v}`)
      .join("\n"),
    ...(checks.length
      ? ["## Checks it has passed", checks.map((b) => `- ${b.text}`).join("\n")]
      : []),
    ...(photos.length
      ? ["## Photos", photos.map((p, i) => `![Photo ${i + 1} of ${site.title}](${p})`).join("\n")]
      : []),
    "## How to ask about it",
    [
      `Send an enquiry from the page: ${enquire}`,
      `${owner?.name ?? "The owner"} is the seller and replies directly. The price, contract and invoice are between the buyer and the owner.`,
      ...(owner?.slug
        ? [`Other sites from this owner: ${absolute(`/owners/${owner.slug}/`)}`]
        : []),
    ].join("\n"),
    `---\n\nThe page this copy is made from: ${url}\nOOHWORKS never sells media or takes a media margin. Owners set prices and keep their clients.`,
  ];
  return `${parts.join("\n\n")}\n`;
}
