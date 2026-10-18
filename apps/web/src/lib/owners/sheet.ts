import { CITIES, FORMATS, LIGHTING } from "@/lib/sites/taxonomy";
import { checkSite, type FieldKey, type Raw, type SiteInput } from "./site-input";

export interface SheetColumn {
  key: FieldKey;
  header: string;
  required: boolean;
  /** What to put in it, in a sentence. Shown on the template's second sheet. */
  help: string;
  example: string;
  /** A fixed list to choose from, offered as a drop-down in the template. */
  options?: string[];
  width: number;
}

/** The marker in the template's example row, so an upload can leave it out however it was edited. */
export const EXAMPLE_REF = "EXAMPLE";
export const MAX_ROWS = 500;

/** One column a fact. The same names the form uses, so a site reads the same however it arrives. */
export const SHEET_COLUMNS: SheetColumn[] = [
  {
    key: "ownerRef",
    header: "Your reference",
    required: false,
    help: "Your own code for the site, if you have one. Uploading a row with the same reference again updates that site instead of adding another.",
    example: EXAMPLE_REF,
    width: 16,
  },
  {
    key: "format",
    header: "Format",
    required: true,
    help: "What kind of site it is.",
    example: "Hoarding",
    options: FORMATS.map((f) => f.label),
    width: 16,
  },
  {
    key: "width",
    header: "Width",
    required: true,
    help: "The width of the face, as a number.",
    example: "20",
    width: 9,
  },
  {
    key: "height",
    header: "Height",
    required: true,
    help: "The height of the face, as a number.",
    example: "10",
    width: 9,
  },
  {
    key: "unit",
    header: "Unit",
    required: false,
    help: "ft or m. Feet if left empty.",
    example: "ft",
    options: ["ft", "m"],
    width: 7,
  },
  {
    key: "lighting",
    header: "Lighting",
    required: true,
    help: "How the face is lit.",
    example: "Front-lit",
    options: LIGHTING.map((l) => l.label),
    width: 12,
  },
  {
    key: "litHours",
    header: "Lit hours",
    required: false,
    help: "When the lights are on, in your own words.",
    example: "6 pm to 11 pm",
    width: 16,
  },
  {
    key: "city",
    header: "City",
    required: true,
    help: "One of the cities we are open in.",
    example: "Bengaluru",
    options: CITIES.map((c) => c.label),
    width: 14,
  },
  {
    key: "locality",
    header: "Area",
    required: true,
    help: "The area or neighbourhood.",
    example: "Koramangala",
    width: 18,
  },
  {
    key: "road",
    header: "Road",
    required: true,
    help: "The road, as a buyer would name it.",
    example: "80 Feet Road",
    width: 24,
  },
  {
    key: "landmark",
    header: "Landmark",
    required: false,
    help: "What it is near or opposite.",
    example: "opposite Sony Signal",
    width: 26,
  },
  {
    key: "lat",
    header: "Latitude",
    required: true,
    help: "To five decimal places, such as 12.93512. Or leave Latitude and Longitude empty and fill “Map link”.",
    example: "12.93512",
    width: 12,
  },
  {
    key: "lng",
    header: "Longitude",
    required: true,
    help: "To five decimal places, such as 77.62214.",
    example: "77.62214",
    width: 12,
  },
  {
    key: "place",
    header: "Map link",
    required: false,
    help: "A Google Maps link to the exact spot, or “12.93512, 77.62214”. Used only when Latitude and Longitude are empty.",
    example: "",
    width: 26,
  },
  {
    key: "facing",
    header: "Facing (degrees)",
    required: false,
    help: "The compass bearing the face points to. North is 0, east is 90, south 180, west 270.",
    example: "225",
    width: 16,
  },
  {
    key: "traffic",
    header: "Traffic it faces",
    required: false,
    help: "The traffic that sees it, in your own words.",
    example: "north-bound",
    width: 18,
  },
  {
    key: "priceDisplay",
    header: "Price shown as",
    required: true,
    help: "exact: buyers see your rate. from: they see it as a “from” price. on request: no price shows. It is your choice.",
    example: "exact",
    options: ["exact", "from", "on request"],
    width: 15,
  },
  {
    key: "rate",
    header: "Rate a month (INR)",
    required: false,
    help: "Your monthly rate in rupees, as a number. Needed unless the price is on request.",
    example: "85000",
    width: 18,
  },
  {
    key: "minPeriod",
    header: "Minimum period",
    required: false,
    help: "The shortest booking you take.",
    example: "3 months",
    width: 16,
  },
  {
    key: "productionCost",
    header: "Printing and mounting",
    required: false,
    help: "What it costs and who does it.",
    example: "₹ 18,000 once, by the owner",
    width: 28,
  },
  {
    key: "notAccepted",
    header: "Categories not accepted",
    required: false,
    help: "Any kinds of advertiser the site cannot carry.",
    example: "Alcohol, tobacco",
    width: 24,
  },
  {
    key: "bookedUntil",
    header: "Booked until",
    required: false,
    help: "A date, if the site is booked now. Leave empty if it is free.",
    example: "",
    width: 14,
  },
  {
    key: "audienceFigure",
    header: "Audience a week",
    required: false,
    help: "People a week, as a number. Fill it only if you can name the source and the date.",
    example: "",
    width: 16,
  },
  {
    key: "audienceMetric",
    header: "Audience measure",
    required: false,
    help: "What the figure counts.",
    example: "",
    width: 26,
  },
  {
    key: "audienceSource",
    header: "Audience source",
    required: false,
    help: "Who measured it. Needed with an audience figure.",
    example: "",
    width: 20,
  },
  {
    key: "audienceMethod",
    header: "Audience method",
    required: false,
    help: "How it was measured.",
    example: "",
    width: 24,
  },
  {
    key: "audienceDate",
    header: "Audience measured on",
    required: false,
    help: "A date. Needed with an audience figure.",
    example: "",
    width: 20,
  },
  {
    key: "permitNumber",
    header: "Permit number",
    required: false,
    help: "The permit or licence number for this site.",
    example: "",
    width: 20,
  },
  {
    key: "permitAuthority",
    header: "Permit issued by",
    required: false,
    help: "The authority that issued it.",
    example: "",
    width: 18,
  },
  {
    key: "permitExpires",
    header: "Permit valid to",
    required: false,
    help: "A date.",
    example: "",
    width: 15,
  },
  {
    key: "artworkSpec",
    header: "Artwork size",
    required: false,
    help: "What a buyer should supply.",
    example: "20 × 10 ft at 30 dpi",
    width: 22,
  },
  {
    key: "fileTypes",
    header: "File type",
    required: false,
    help: "The file types you take.",
    example: "PDF or TIFF, CMYK",
    width: 20,
  },
  {
    key: "leadTimeDays",
    header: "Lead time (days)",
    required: false,
    help: "How many days before the start you need the artwork.",
    example: "7",
    width: 16,
  },
  {
    key: "resolution",
    header: "Screen resolution",
    required: false,
    help: "For screens only.",
    example: "",
    width: 17,
  },
  {
    key: "spotSeconds",
    header: "Spot length (seconds)",
    required: false,
    help: "For screens only.",
    example: "",
    width: 20,
  },
  {
    key: "loopSeconds",
    header: "Loop length (seconds)",
    required: false,
    help: "For screens only.",
    example: "",
    width: 20,
  },
  {
    key: "advertisers",
    header: "Advertisers in the loop",
    required: false,
    help: "For screens only.",
    example: "",
    width: 22,
  },
];

const squash = (v: string): string => v.toLowerCase().replace(/[^a-z0-9]+/g, "");
const BY_HEADER = new Map(SHEET_COLUMNS.map((c) => [squash(c.header), c]));

/** A spreadsheet cell as text: dates as YYYY-MM-DD, numbers without stray decimals, everything else trimmed. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "object") {
    // What a spreadsheet library hands back for a formula, a link or styled text.
    const v = value as { result?: unknown; text?: unknown; richText?: { text?: string }[] };
    if (v.result !== undefined) return cellText(v.result);
    if (Array.isArray(v.richText))
      return v.richText
        .map((r) => r.text ?? "")
        .join("")
        .trim();
    if (v.text !== undefined) return cellText(v.text);
    return "";
  }
  return String(value).trim();
}

export interface RowProblem {
  /** The row number as the owner sees it in their spreadsheet. */
  row: number;
  column: string;
  problem: string;
}

export interface SheetResult {
  sites: { row: number; site: SiteInput }[];
  problems: RowProblem[];
  /** Headers in the file that match no column, so the owner knows they were not read. */
  unknown: string[];
  /** Why the whole file was refused, if it was. */
  refused: string | null;
}

/**
 * Reads a filled-in template. A row that is right becomes a site; a row that is not is reported by its
 * row number and column, in words that say what to change. One bad row never stops the good ones.
 */
export function readSheet(header: unknown[], rows: unknown[][], today: string): SheetResult {
  const columns = header.map((h) => BY_HEADER.get(squash(cellText(h))) ?? null);
  const unknown = header.map(cellText).filter((h, i) => h !== "" && !columns[i]);
  const empty: SheetResult = { sites: [], problems: [], unknown, refused: null };
  const missing = SHEET_COLUMNS.filter(
    (c) =>
      c.required &&
      !columns.some((x) => x?.key === c.key) &&
      !(c.key === "lat" || c.key === "lng" ? columns.some((x) => x?.key === "place") : false),
  );
  if (missing.length)
    return {
      ...empty,
      refused: `This does not look like the OOHWORKS template. It has no column called ${missing.map((c) => `“${c.header}”`).join(", ")}. Download the template and copy your sites into it.`,
    };

  const filled = rows
    .map((cells, i) => ({
      row: i + 2,
      raw: Object.fromEntries(
        columns.flatMap((c, j) => (c ? [[c.key, cellText(cells[j])]] : [])),
      ) as Raw,
    }))
    .filter((r) => Object.values(r.raw).some((v) => v !== "") && r.raw.ownerRef !== EXAMPLE_REF);
  if (filled.length === 0)
    return {
      ...empty,
      refused:
        "There are no sites in this file yet. Add one row for each site, under the headings.",
    };
  if (filled.length > MAX_ROWS)
    return {
      ...empty,
      refused: `This file has ${filled.length} sites. Upload up to ${MAX_ROWS} at a time.`,
    };

  const out: SheetResult = { ...empty };
  const refs = new Map<string, number>();
  for (const { row, raw } of filled) {
    const ref = raw.ownerRef?.trim().toLowerCase();
    if (ref) {
      const first = refs.get(ref);
      if (first) {
        out.problems.push({
          row,
          column: "Your reference",
          problem: `“${raw.ownerRef}” is also on row ${first}. Each site needs its own reference, or none.`,
        });
        continue;
      }
      refs.set(ref, row);
    }
    const checked = checkSite(raw, today);
    if (checked.ok) out.sites.push({ row, site: checked.site });
    else
      for (const [key, problem] of Object.entries(checked.errors))
        out.problems.push({
          row,
          column: SHEET_COLUMNS.find((c) => c.key === key)?.header ?? key,
          problem,
        });
  }
  return out;
}
