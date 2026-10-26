"use client";

import countryToCurrency from "country-to-currency";
import { useEffect, useState } from "react";
import { COUNTRY_COOKIE } from "@/lib/world/geo";
import { money } from "@/lib/world/money";

interface Rates {
  date: string | null;
  source: string;
  rates: Record<string, number> | null;
}

let loading: Promise<Rates | null> | null = null;
/** One request for the rates, however many prices the page shows. */
function rates(): Promise<Rates | null> {
  loading ??= fetch("/api/rates/")
    .then((r) => (r.ok ? (r.json() as Promise<Rates>) : null))
    .catch(() => null);
  return loading;
}

function visitorCurrency(): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${COUNTRY_COOKIE}=`));
  const code = hit?.slice(COUNTRY_COOKIE.length + 1).toUpperCase() ?? "";
  return (countryToCurrency as Record<string, string>)[code] ?? null;
}

/** Rounded so a converted figure never looks more exact than it is. */
const round = (n: number): number => {
  const step = n >= 100000 ? 1000 : n >= 10000 ? 100 : 10;
  return Math.round(n / step) * step;
};

/**
 * "≈ AED 3,750" beside a price in another currency, in the visitor's own, with the rate's date and
 * source. Nothing is shown when the currencies match, when the visitor's country is unknown, or when
 * there are no rates: the owner's price is the price.
 */
export function Approx({
  amount,
  currency,
  className = "",
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  const [text, setText] = useState<{ figure: string; note: string } | null>(null);
  useEffect(() => {
    const mine = visitorCurrency();
    if (!mine || mine === currency.toUpperCase()) return;
    let live = true;
    rates().then((r) => {
      const from = r?.rates?.[currency.toUpperCase()];
      const to = r?.rates?.[mine];
      if (!live || !from || !to) return;
      setText({
        figure: `≈ ${money(round((amount / from) * to), mine)}`,
        note: `Approximate, at ${r?.source ?? "a published"} rate${r?.date ? ` of ${r.date}` : ""}. The owner's price is the price.`,
      });
    });
    return () => {
      live = false;
    };
  }, [amount, currency]);
  if (!text) return null;
  return (
    <span className={`t-small text-ink-muted ${className}`} title={text.note} data-approx="">
      {text.figure}
      <span className="sr-only">. {text.note}</span>
    </span>
  );
}
