import { CITY_OPTIONS } from "@/lib/search-parse";
import {
  CITIES,
  FORMATS,
  LIGHTING,
  type CitySlug,
  type FormatSlug,
  type LightingSlug,
} from "@/lib/sites/taxonomy";
import { readCoords } from "./coords";

/** A site as an owner gives it: from the form, or from one row of the spreadsheet. */
export interface SiteInput {
  ownerRef: string | null;
  format: FormatSlug;
  width: number;
  height: number;
  sizeUnit: "ft" | "m";
  lighting: LightingSlug;
  litHours: string | null;
  city: CitySlug;
  locality: string;
  road: string;
  landmark: string | null;
  lat: number;
  lng: number;
  facingDeg: number | null;
  trafficDirection: string | null;
  priceDisplay: "exact" | "from" | "on_request";
  rate: number | null;
  minPeriod: string | null;
  productionCost: string | null;
  notAccepted: string | null;
  bookedUntil: string | null;
  audience: {
    figure: number;
    metric: string | null;
    source: string;
    method: string | null;
    measuredOn: string;
  } | null;
  permit: { number: string; authority: string | null; expiresOn: string | null } | null;
  artworkSpec: string | null;
  fileTypes: string | null;
  leadTimeDays: number | null;
  digital: {
    resolution: string | null;
    spotSeconds: number | null;
    loopSeconds: number | null;
    advertisers: number | null;
  } | null;
}

/** The names of the fields, shared by the form's inputs and the spreadsheet's columns. */
export const FIELD_KEYS = [
  "ownerRef",
  "format",
  "width",
  "height",
  "unit",
  "lighting",
  "litHours",
  "city",
  "locality",
  "road",
  "landmark",
  "lat",
  "lng",
  "place",
  "facing",
  "traffic",
  "priceDisplay",
  "rate",
  "minPeriod",
  "productionCost",
  "notAccepted",
  "bookedUntil",
  "audienceFigure",
  "audienceMetric",
  "audienceSource",
  "audienceMethod",
  "audienceDate",
  "permitNumber",
  "permitAuthority",
  "permitExpires",
  "artworkSpec",
  "fileTypes",
  "leadTimeDays",
  "resolution",
  "spotSeconds",
  "loopSeconds",
  "advertisers",
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];
export type Raw = Partial<Record<FieldKey, string>>;
export type FieldErrors = Partial<Record<FieldKey, string>>;

const squash = (v: string): string =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const text = (v: string | undefined, max: number): string | null => {
  const t = (v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
  return t === "" ? null : t;
};
/** "85,000", "₹ 85000", "1.2" → a number. Null when empty, NaN when it is not a number. */
const num = (v: string | undefined): number | null => {
  const t = (v ?? "").trim().replace(/[₹,\s]/g, "");
  if (t === "") return null;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN;
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number): string => String(n).padStart(2, "0");
/** A date as YYYY-MM-DD, from that form, "03/10/2026" (day first, as written in India) or "3 Oct 2026". */
export function readDate(v: string | undefined): string | null | "bad" {
  const t = (v ?? "").trim();
  if (t === "") return null;
  let y = 0;
  let m = 0;
  let d = 0;
  let hit = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (hit) [y, m, d] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t)))
    [d, m, y] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})$/.exec(t)))
    [d, m, y] = [Number(hit[1]), MONTHS.indexOf((hit[2] ?? "").toLowerCase()) + 1, Number(hit[3])];
  else return "bad";
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    m < 1 ||
    m > 12 ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  )
    return "bad";
  return `${y}-${pad(m)}-${pad(d)}`;
}

function pickFormat(v: string | undefined): FormatSlug | null {
  const t = squash(v ?? "");
  if (!t) return null;
  const hit =
    FORMATS.find((f) =>
      [f.slug.replace(/-/g, " "), squash(f.label), squash(f.plural), squash(f.inSentence)].includes(
        t,
      ),
    ) ??
    (t === "billboard" || t === "billboards"
      ? FORMATS[0]
      : t === "led" || t === "digital screen" || t === "dooh"
        ? FORMATS.find((f) => f.slug === "led-screen")
        : undefined);
  return hit?.slug ?? null;
}
function pickLighting(v: string | undefined): LightingSlug | null {
  const t = squash(v ?? "");
  if (!t) return null;
  const alias: Record<string, LightingSlug> = {
    "front lit": "front-lit",
    frontlit: "front-lit",
    lit: "front-lit",
    "back lit": "back-lit",
    backlit: "back-lit",
    "not lit": "unlit",
    unlit: "unlit",
    "non lit": "unlit",
    none: "unlit",
    digital: "digital",
    led: "digital",
  };
  return alias[t] ?? LIGHTING.find((l) => squash(l.label) === t)?.slug ?? null;
}
function pickCity(v: string | undefined): CitySlug | null {
  const t = squash(v ?? "");
  if (!t) return null;
  const direct = CITIES.find((c) => c.slug.replace(/-/g, " ") === t || squash(c.label) === t);
  if (direct) return direct.slug;
  return (
    (CITY_OPTIONS.find((c) => (c.names as readonly string[]).includes(t))?.slug as
      CitySlug | undefined) ?? null
  );
}
function pickPrice(v: string | undefined): SiteInput["priceDisplay"] | null {
  const t = squash(v ?? "");
  if (t === "exact" || t === "exact rate" || t === "rate") return "exact";
  if (t === "from" || t === "from price") return "from";
  if (
    t === "on request" ||
    t === "price on request" ||
    t === "request" ||
    t === "hidden" ||
    t === "on_request"
  )
    return "on_request";
  return null;
}

/**
 * Checks one site and tidies it. Every problem is named against its field, in words the owner can act
 * on, so the form can show it beside the input and the spreadsheet can report it by column.
 */
export function checkSite(
  raw: Raw,
  today: string,
): { ok: true; site: SiteInput } | { ok: false; errors: FieldErrors } {
  const e: FieldErrors = {};
  const format = pickFormat(raw.format);
  if (!format)
    e.format = raw.format?.trim()
      ? `“${raw.format.trim()}” is not a format we list. Use one of: ${FORMATS.map((f) => f.label).join(", ")}.`
      : "Choose the format.";
  const lighting = pickLighting(raw.lighting);
  if (!lighting)
    e.lighting = raw.lighting?.trim()
      ? `“${raw.lighting.trim()}” is not a lighting type. Use one of: ${LIGHTING.map((l) => l.label).join(", ")}.`
      : "Choose the lighting.";

  const unitRaw = squash(raw.unit ?? "");
  const sizeUnit: "ft" | "m" = unitRaw === "m" || unitRaw.startsWith("met") ? "m" : "ft";
  const width = num(raw.width);
  const height = num(raw.height);
  const max = sizeUnit === "ft" ? 400 : 120;
  if (width === null || Number.isNaN(width) || width <= 0 || width > max)
    e.width = `Give the width as a number of ${sizeUnit === "ft" ? "feet" : "metres"}, such as ${sizeUnit === "ft" ? "20" : "6"}.`;
  if (height === null || Number.isNaN(height) || height <= 0 || height > max)
    e.height = `Give the height as a number of ${sizeUnit === "ft" ? "feet" : "metres"}, such as ${sizeUnit === "ft" ? "10" : "3"}.`;

  const city = pickCity(raw.city);
  if (!city)
    e.city = raw.city?.trim()
      ? `We are not open in “${raw.city.trim()}” yet. The cities are: ${CITIES.map((c) => c.label).join(", ")}.`
      : "Choose the city.";
  const locality = text(raw.locality, 60);
  if (!locality) e.locality = "Give the area or neighbourhood, such as Koramangala.";
  const road = text(raw.road, 80);
  if (!road) e.road = "Give the road, as a buyer would name it.";

  let lat = num(raw.lat);
  let lng = num(raw.lng);
  if (lat === null && lng === null && raw.place?.trim()) {
    const found = readCoords(raw.place);
    if (found) [lat, lng] = [found.lat, found.lng];
    else
      e.place =
        "We could not find a position in that. Paste coordinates such as 12.93512, 77.62214, or a Google Maps link to the exact spot.";
  }
  if (!e.place) {
    if (lat === null || Number.isNaN(lat) || lat < -90 || lat > 90)
      e.lat = raw.lat?.trim()
        ? `“${raw.lat.trim()}” is not a latitude. Use a number such as 12.93512.`
        : "Put the pin on the map, or give the latitude.";
    if (lng === null || Number.isNaN(lng) || lng < -180 || lng > 180)
      e.lng = raw.lng?.trim()
        ? `“${raw.lng.trim()}” is not a longitude. Use a number such as 77.62214.`
        : "Put the pin on the map, or give the longitude.";
    // India only, for now: a pin far outside it is almost always latitude and longitude swapped.
    if (
      !e.lat &&
      !e.lng &&
      lat !== null &&
      lng !== null &&
      (lat < 6 || lat > 37.5 || lng < 68 || lng > 97.5)
    )
      e.lat = "That position is outside India. Check that latitude and longitude are not swapped.";
  }
  const facing = num(raw.facing);
  if (facing !== null && (Number.isNaN(facing) || facing < 0 || facing >= 360))
    e.facing = "Facing is a compass bearing from 0 to 359. North is 0, east is 90.";

  const priceDisplay =
    pickPrice(raw.priceDisplay) ??
    (raw.priceDisplay?.trim() ? null : num(raw.rate) ? "exact" : "on_request");
  if (!priceDisplay) e.priceDisplay = "Say how the price shows: exact, from, or on request.";
  const rate = num(raw.rate);
  if (rate !== null && (Number.isNaN(rate) || rate <= 0 || rate > 1e9))
    e.rate = "Give the monthly rate as a number of rupees, such as 85000.";
  else if (priceDisplay && priceDisplay !== "on_request" && rate === null)
    e.rate =
      "Price is set to show, but there is no rate. Give a rate, or set the price to “on request”.";

  const booked = readDate(raw.bookedUntil);
  if (booked === "bad") e.bookedUntil = "Give the date as 14 Nov 2026 or 2026-11-14.";
  else if (booked && booked < today)
    e.bookedUntil = "That date has passed. Leave it empty if the site is free now.";

  const figure = num(raw.audienceFigure);
  const source = text(raw.audienceSource, 80);
  const measured = readDate(raw.audienceDate);
  if (figure !== null && (Number.isNaN(figure) || figure <= 0))
    e.audienceFigure = "Give the weekly audience as a number, or leave it empty.";
  if (measured === "bad") e.audienceDate = "Give the date as 1 Sep 2026 or 2026-09-01.";
  if (figure !== null && !Number.isNaN(figure) && figure > 0) {
    if (!source)
      e.audienceSource =
        "An audience figure needs its source. Without one, leave the figure empty.";
    if (measured === null) e.audienceDate = "An audience figure needs the date it was measured.";
    else if (measured !== "bad" && measured > today) e.audienceDate = "That date is in the future.";
  }

  const permitNumber = text(raw.permitNumber, 60);
  const permitExpires = readDate(raw.permitExpires);
  if (permitExpires === "bad") e.permitExpires = "Give the date as 31 Mar 2027 or 2027-03-31.";
  if (
    !permitNumber &&
    (text(raw.permitAuthority, 80) || (permitExpires && permitExpires !== "bad"))
  )
    e.permitNumber = "Give the permit number, or leave the permit fields empty.";

  const lead = num(raw.leadTimeDays);
  if (lead !== null && (Number.isNaN(lead) || lead < 0 || lead > 365))
    e.leadTimeDays = "Give the lead time as a number of days.";
  const whole = (
    key: "spotSeconds" | "loopSeconds" | "advertisers",
    label: string,
  ): number | null => {
    const n = num(raw[key]);
    if (n !== null && (Number.isNaN(n) || n <= 0 || n > 100000))
      e[key] = `Give the ${label} as a number.`;
    return n !== null && !Number.isNaN(n) ? Math.round(n) : null;
  };
  const spot = whole("spotSeconds", "spot length in seconds");
  const loop = whole("loopSeconds", "loop length in seconds");
  const advertisers = whole("advertisers", "number of advertisers in the loop");

  if (Object.keys(e).length > 0) return { ok: false, errors: e };
  const isDigital = format === "led-screen" || lighting === "digital";
  const resolution = text(raw.resolution, 40);
  return {
    ok: true,
    site: {
      ownerRef: text(raw.ownerRef, 40),
      format: format as FormatSlug,
      width: width as number,
      height: height as number,
      sizeUnit,
      lighting: lighting as LightingSlug,
      litHours: text(raw.litHours, 40),
      city: city as CitySlug,
      locality: locality as string,
      road: road as string,
      landmark: text(raw.landmark, 80),
      lat: Number((lat as number).toFixed(5)),
      lng: Number((lng as number).toFixed(5)),
      facingDeg: facing === null ? null : Math.round(facing),
      trafficDirection: text(raw.traffic, 40),
      priceDisplay: priceDisplay as SiteInput["priceDisplay"],
      rate: priceDisplay === "on_request" ? null : Math.round(rate as number),
      minPeriod: text(raw.minPeriod, 40),
      productionCost: text(raw.productionCost, 80),
      notAccepted: text(raw.notAccepted, 120),
      bookedUntil: booked as string | null,
      audience:
        figure && source && measured
          ? {
              figure: Math.round(figure),
              metric: text(raw.audienceMetric, 80),
              source,
              method: text(raw.audienceMethod, 80),
              measuredOn: measured as string,
            }
          : null,
      permit: permitNumber
        ? {
            number: permitNumber,
            authority: text(raw.permitAuthority, 80),
            expiresOn: permitExpires as string | null,
          }
        : null,
      artworkSpec: text(raw.artworkSpec, 80),
      fileTypes: text(raw.fileTypes, 60),
      leadTimeDays: lead === null ? null : Math.round(lead),
      digital:
        isDigital && (resolution || spot || loop || advertisers)
          ? { resolution, spotSeconds: spot, loopSeconds: loop, advertisers }
          : null,
    },
  };
}

/** A site as stored, from a checked input. Confirming availability is dated today: the owner is saying so now. */
export function toSiteData(site: SiteInput, today: string) {
  return {
    ownerRef: site.ownerRef,
    format: site.format,
    environment:
      site.format === "bus-shelter" || site.format === "transit"
        ? ("transit" as const)
        : ("roadside" as const),
    width: site.width,
    height: site.height,
    sizeUnit: site.sizeUnit,
    lighting: site.lighting,
    litHours: site.litHours,
    country: "in",
    city: site.city,
    locality: site.locality,
    road: site.road,
    landmark: site.landmark,
    lat: site.lat,
    lng: site.lng,
    facingDeg: site.facingDeg,
    trafficDirection: site.trafficDirection,
    priceDisplay: site.priceDisplay,
    rate: site.rate,
    minPeriod: site.minPeriod,
    productionCost: site.productionCost,
    taxesNote: "Taxes extra",
    notAccepted: site.notAccepted,
    bookedUntil: site.bookedUntil,
    availabilityConfirmedOn: today,
    artworkSpec: site.artworkSpec,
    fileTypes: site.fileTypes,
    leadTimeDays: site.leadTimeDays,
    audience: site.audience ?? {
      figure: null,
      metric: null,
      source: null,
      method: null,
      measuredOn: null,
    },
    permit: site.permit ?? { number: null, authority: null, expiresOn: null },
    digital: site.digital ?? {
      resolution: null,
      spotSeconds: null,
      loopSeconds: null,
      advertisers: null,
    },
  };
}

const str = (v: string | number | null | undefined): string =>
  v === null || v === undefined ? "" : String(v);
const dayOf = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : "");

/** A stored site as the form's fields, so editing starts from what is saved. */
export function rawFromSite(site: {
  ownerRef?: string | null;
  format: string;
  width: number;
  height: number;
  sizeUnit: string;
  lighting: string;
  litHours?: string | null;
  city: string;
  locality: string;
  road: string;
  landmark?: string | null;
  lat: number;
  lng: number;
  facingDeg?: number | null;
  trafficDirection?: string | null;
  priceDisplay: string;
  rate?: number | null;
  minPeriod?: string | null;
  productionCost?: string | null;
  notAccepted?: string | null;
  bookedUntil?: string | null;
  artworkSpec?: string | null;
  fileTypes?: string | null;
  leadTimeDays?: number | null;
  audience?: {
    figure?: number | null;
    metric?: string | null;
    source?: string | null;
    method?: string | null;
    measuredOn?: string | null;
  } | null;
  permit?: { number?: string | null; authority?: string | null; expiresOn?: string | null } | null;
  digital?: {
    resolution?: string | null;
    spotSeconds?: number | null;
    loopSeconds?: number | null;
    advertisers?: number | null;
  } | null;
}): Raw {
  return {
    ownerRef: str(site.ownerRef),
    format: site.format,
    width: str(site.width),
    height: str(site.height),
    unit: site.sizeUnit,
    lighting: site.lighting,
    litHours: str(site.litHours),
    city: site.city,
    locality: site.locality,
    road: site.road,
    landmark: str(site.landmark),
    lat: site.lat.toFixed(5),
    lng: site.lng.toFixed(5),
    place: "",
    facing: str(site.facingDeg),
    traffic: str(site.trafficDirection),
    priceDisplay: site.priceDisplay,
    rate: str(site.rate),
    minPeriod: str(site.minPeriod),
    productionCost: str(site.productionCost),
    notAccepted: str(site.notAccepted),
    bookedUntil: dayOf(site.bookedUntil),
    audienceFigure: str(site.audience?.figure),
    audienceMetric: str(site.audience?.metric),
    audienceSource: str(site.audience?.source),
    audienceMethod: str(site.audience?.method),
    audienceDate: dayOf(site.audience?.measuredOn),
    permitNumber: str(site.permit?.number),
    permitAuthority: str(site.permit?.authority),
    permitExpires: dayOf(site.permit?.expiresOn),
    artworkSpec: str(site.artworkSpec),
    fileTypes: str(site.fileTypes),
    leadTimeDays: str(site.leadTimeDays),
    resolution: str(site.digital?.resolution),
    spotSeconds: str(site.digital?.spotSeconds),
    loopSeconds: str(site.digital?.loopSeconds),
    advertisers: str(site.digital?.advertisers),
  };
}
