import { COUNTRIES, findCountry } from "./countries";

const NBSP = " ";

/** The country whose grouping a currency is written in: rupees in lakh, dollars in thousands. */
const HOME: Map<string, string> = new Map(
  [...COUNTRIES].reverse().map((c) => [c.currency, c.code] as const),
);
HOME.set("USD", "US");
HOME.set("EUR", "DE");
HOME.set("GBP", "GB");
HOME.set("INR", "IN");

function localeFor(currency: string): string {
  return findCountry(HOME.get(currency.toUpperCase()))?.locale ?? "en-GB";
}

const symbols = new Map<string, string>();
/** "₹", "$", "£", "€", or the code where the symbol would be ambiguous or long ("AED"). */
function symbolOf(currency: string): string {
  const key = currency.toUpperCase();
  const known = symbols.get(key);
  if (known) return known;
  let symbol = key;
  try {
    const part = new Intl.NumberFormat("en", {
      style: "currency",
      currency: key,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value;
    // A one- or two-character sign reads at a glance; anything longer is clearer as the code.
    if (part && part.length <= 2 && !/[A-Za-z]{2}/.test(part)) symbol = part;
  } catch {
    // An unknown code is shown as it is.
  }
  // "$" alone is shared by many dollars; only the US dollar keeps it bare.
  if (symbol === "$" && key !== "USD") symbol = key;
  symbols.set(key, symbol);
  return symbol;
}

/**
 * A whole amount in its own currency, grouped as that currency's country writes it:
 * "₹ 1,25,000", "AED 12,500", "$ 4,000". The sign sits before the figure with a no-break space.
 */
export function money(amount: number, currency: string): string {
  const grouped = Math.round(amount).toLocaleString(localeFor(currency));
  return `${symbolOf(currency)}${NBSP}${grouped}`;
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/**
 * A large count in words as the country says it: "4.2 lakh" and "1.3 crore" in India, "1.2 million"
 * elsewhere, and smaller figures grouped.
 */
export function countWords(n: number, country?: string | null): string {
  const c = findCountry(country);
  if (!c || c.code === "IN") {
    if (n >= 1e7) return `${trim(n / 1e7)} crore`;
    if (n >= 1e5) return `${trim(n / 1e5)} lakh`;
    return Math.round(n).toLocaleString("en-IN");
  }
  if (n >= 1e9) return `${trim(n / 1e9)} billion`;
  if (n >= 1e6) return `${trim(n / 1e6)} million`;
  return Math.round(n).toLocaleString(c.locale);
}
