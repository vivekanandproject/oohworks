import { money } from "@/lib/world/money";
import { priceCurrency, readState } from "./state";
import { formatDef, lightingDef, cityName } from "./taxonomy";

export interface BriefChip {
  key: string;
  label: string;
}

/**
 * What the search will read from a typed brief, as the chips the results page shows under its box: the
 * same rules (src/lib/search-parse.ts through readState) and the same labels, so the home page never
 * promises a reading the search would not make. Plain code, safe in the browser.
 */
export function briefChips(text: string): BriefChip[] {
  const typed = text.trim();
  if (!typed) return [];
  const { state, understood } = readState({ q: typed });
  if (!understood) return [];
  const chips: BriefChip[] = [];
  if (state.city) chips.push({ key: "city", label: cityName(state.city) });
  for (const f of state.formats)
    chips.push({ key: `format-${f}`, label: formatDef(f)?.plural ?? f });
  if (state.size) chips.push({ key: "size", label: `${state.size.w} × ${state.size.h} ft` });
  if (state.max)
    chips.push({ key: "max", label: `Under ${money(state.max, priceCurrency(state))} a month` });
  for (const l of state.lighting)
    chips.push({ key: `lit-${l}`, label: lightingDef(l)?.label ?? l });
  if (state.q) chips.push({ key: "q", label: `“${state.q}”` });
  return chips;
}
