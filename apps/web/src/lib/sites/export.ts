import { formatDate } from "@/lib/editorial/format";
import type { Owner, Site } from "@/payload-types";
import type { Listing } from "./filter";
import { freeFor } from "./plan";
import { formatDef, lightingDef, cityDef } from "./taxonomy";
import { availabilityOf, permitState, sizeFeet } from "./view";

export type Cell = string | number | null;

export interface Column {
  header: string;
  /** Characters wide in a spreadsheet. */
  width: number;
  /** Numbers that are money, so a spreadsheet can format them. */
  money?: boolean;
}

export interface ExportItem {
  listing: Listing;
  site: Site;
  owner: Owner | null;
}

const PRICE_MODE = { exact: "Exact rate", from: "“From” price", on_request: "On request" } as const;
const day = (iso: string | null | undefined): string | null => (iso ? formatDate(iso) : null);

/**
 * A standard site sheet as rows: one site per row, the same columns every time, so shortlists from
 * different searches line up. Every figure is the owner's own; a blank means the owner has not given it.
 */
export function exportTable(
  items: ExportItem[],
  now: number,
  absolute: (path: string) => string,
  from?: string,
): { columns: Column[]; rows: Cell[][] } {
  const columns: Column[] = [
    { header: "Unit ID", width: 11 },
    { header: "Site", width: 38 },
    { header: "Format", width: 14 },
    { header: "Static or digital", width: 16 },
    { header: "Size", width: 14 },
    { header: "Width (mm)", width: 12 },
    { header: "Height (mm)", width: 12 },
    { header: "Lighting", width: 12 },
    { header: "Road", width: 26 },
    { header: "Landmark", width: 30 },
    { header: "Locality", width: 18 },
    { header: "City", width: 14 },
    { header: "Latitude", width: 11 },
    { header: "Longitude", width: 11 },
    { header: "Facing (degrees)", width: 15 },
    { header: "Traffic", width: 16 },
    { header: "Price shown as", width: 15 },
    { header: "Rate a month (INR)", width: 18, money: true },
    { header: "Minimum period", width: 15 },
    { header: "Printing and mounting", width: 30 },
    { header: "Availability", width: 26 },
    { header: "Booked until", width: 13 },
    { header: "Availability confirmed", width: 20 },
    ...(from ? [{ header: `Free on ${formatDate(from)}`, width: 18 }] : []),
    { header: "Audience a week", width: 16 },
    { header: "Audience source", width: 22 },
    { header: "Audience measured", width: 18 },
    { header: "Permit number", width: 20 },
    { header: "Permit authority", width: 20 },
    { header: "Permit valid to", width: 15 },
    { header: "Owner", width: 28 },
    { header: "Owner verified", width: 14 },
    { header: "Owner's typical reply (hours)", width: 26 },
    { header: "Listing", width: 60 },
    { header: "Note", width: 34 },
  ];
  const rows = items.map(({ listing, site, owner }): Cell[] => {
    const audience =
      site.audience?.figure && site.audience.source && site.audience.measuredOn
        ? site.audience
        : null;
    const permit = permitState(site, now);
    const free = freeFor(listing, from);
    return [
      site.permanentId ?? "",
      site.title ?? "",
      formatDef(site.format)?.label ?? site.format,
      listing.isDigital ? "Digital" : "Static",
      sizeFeet(site),
      site.widthMm ?? null,
      site.heightMm ?? null,
      lightingDef(site.lighting)?.label ?? site.lighting,
      site.road,
      site.landmark ?? null,
      site.locality,
      cityDef(site.city)?.label ?? site.city,
      Number(site.lat.toFixed(5)),
      Number(site.lng.toFixed(5)),
      site.facingDeg ?? null,
      site.trafficDirection ?? null,
      PRICE_MODE[site.priceDisplay],
      listing.priceShown ? listing.rate : null,
      site.minPeriod ?? null,
      site.productionCost ?? null,
      availabilityOf(site, now).label,
      day(site.bookedUntil),
      day(site.availabilityConfirmedOn),
      ...(from ? [free === "booked" ? "No, booked" : "Not booked"] : []),
      audience?.figure ?? null,
      audience?.source ?? null,
      audience ? day(audience.measuredOn) : null,
      permit === "none" ? null : (site.permit?.number ?? null),
      permit === "none" ? null : (site.permit?.authority ?? null),
      permit === "none"
        ? null
        : `${day(site.permit?.expiresOn) ?? ""}${permit === "expired" ? " (expired)" : ""}`.trim() ||
          null,
      owner?.name ?? "",
      owner?.verified ? "Yes" : "No",
      owner?.medianReplyHours ?? null,
      absolute(listing.url),
      site.sample ? "Sample listing, not a real site" : null,
    ];
  });
  return { columns, rows };
}

/** Text that a spreadsheet would read as a formula is made plain, so an exported cell can never run anything. */
export function plainCell(value: Cell): string {
  if (value === null) return "";
  const text = String(value);
  return typeof value === "string" && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

export function toCsv(columns: Column[], rows: Cell[][]): string {
  const quote = (v: Cell): string => `"${plainCell(v).replace(/"/g, '""')}"`;
  const lines = [
    columns.map((c) => quote(c.header)).join(","),
    ...rows.map((r) => r.map(quote).join(",")),
  ];
  // The byte-order mark lets Excel read the rupee sign and the multiplication sign correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
