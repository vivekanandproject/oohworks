import type { Metadata } from "next";
import { Button, Chip, Container, EmptyState, Icon, SearchField } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { FollowForm } from "@/components/FollowForm";
import {
  CITY_OPTIONS,
  FORMAT_OPTIONS,
  cityLabel,
  formatBudget,
  formatLabel,
  parseQuery,
  searchUrl,
} from "@/lib/search-parse";

/** Search results are never indexed; hubs and unit pages are the pages that rank. */
export const metadata: Metadata = {
  title: "Find sites",
  robots: { index: false, follow: true },
};

const EXAMPLES = [
  "Hoardings in Bengaluru",
  "LED screens in Mumbai under ₹2 lakh",
  "20 × 10 ft near Silk Board junction",
  "Bus shelters in Pune",
  "Unipoles on Outer Ring Road",
];

interface Params {
  q?: string;
  city?: string;
  format?: string;
  followed?: string;
  follow?: string;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const q = (p.q ?? "").trim();
  const parsed = parseQuery(q);
  const city = p.city || parsed.facets.city;
  const format = p.format || parsed.facets.format;
  const here = searchUrl({ q, city: p.city, format: p.format });

  const understood: { key: string; label: string; remove: string }[] = [];
  if (city)
    understood.push({
      key: "city",
      label: cityLabel(city) ?? city,
      remove: searchUrl({
        q: parsed.facets.city === city ? stripFacet(q, city) : q,
        format: p.format,
      }),
    });
  if (format)
    understood.push({
      key: "format",
      label: formatLabel(format) ?? format,
      remove: searchUrl({
        q: parsed.facets.format === format ? stripFacet(q, format) : q,
        city: p.city,
      }),
    });
  if (parsed.facets.size)
    understood.push({
      key: "size",
      label: `${parsed.facets.size.w} × ${parsed.facets.size.h} ft`,
      remove: here,
    });
  if (parsed.facets.budget)
    understood.push({
      key: "budget",
      label: `Under ${formatBudget(parsed.facets.budget)} a month`,
      remove: here,
    });
  if (parsed.facets.lighting)
    understood.push({ key: "lighting", label: parsed.facets.lighting, remove: here });
  if (parsed.facets.area)
    understood.push({ key: "area", label: `Near ${titleCase(parsed.facets.area)}`, remove: here });

  const what = [formatLabel(format)?.toLowerCase() ?? "sites", city ? `in ${cityLabel(city)}` : ""]
    .filter(Boolean)
    .join(" ");
  const emptyTitle =
    city || format ? `No ${what} yet` : q ? `No sites match “${q}” yet` : "No sites listed yet";

  return (
    <Shell active="find">
      <Container className="py-10 lg:py-14">
        <div className="mx-auto max-w-[760px]">
          <h1 className="t-display-lg">Find sites</h1>
          <p className="t-body text-ink-muted mt-3">
            Type a place, a road, a format or a size. ohworks shows what it understood before it
            searches.
          </p>
          <div className="mt-6">
            <SearchField
              defaultValue={q}
              size="lg"
              placeholder="Try: hoardings in Bengaluru, or 20 × 10 ft near Silk Board"
            />
          </div>

          {understood.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2" data-section="understood">
              <span className="t-small text-ink-muted">Understood as</span>
              {understood.map((u) => (
                <Chip key={u.key} href={u.remove} pressed removable ariaLabel={`Remove ${u.label}`}>
                  {u.label}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <span className="t-label text-ink-muted pt-2">Format</span>
            <div className="flex flex-wrap gap-2" data-section="formats">
              {FORMAT_OPTIONS.map((f) => {
                const on = format === f.slug;
                return (
                  <Chip
                    key={f.slug}
                    href={searchUrl({ q, city: p.city, format: on ? undefined : f.slug })}
                    pressed={on}
                  >
                    {f.label}
                  </Chip>
                );
              })}
            </div>
            <span className="t-label text-ink-muted pt-2">City</span>
            <div className="flex flex-wrap gap-2" data-section="cities">
              {CITY_OPTIONS.map((c) => {
                const on = city === c.slug;
                return (
                  <Chip
                    key={c.slug}
                    href={searchUrl({ q, format: p.format, city: on ? undefined : c.slug })}
                    pressed={on}
                  >
                    {c.label}
                  </Chip>
                );
              })}
            </div>
          </div>

          {p.followed ? (
            <div className="oh-toast success mt-8" role="status">
              <span className="dot" />
              <div>
                <div className="t">You are on the list.</div>
                <div className="d">
                  We will email you when the first {what} are listed. One email, then you choose.
                </div>
              </div>
            </div>
          ) : null}
          {p.follow === "invalid" ? (
            <div className="oh-toast error mt-8" role="alert">
              <span className="dot" />
              <div>
                <div className="t">That email did not look right.</div>
                <div className="d">Check it and try again; nothing was saved.</div>
              </div>
            </div>
          ) : null}

          <div className="mt-10" data-section="results">
            <EmptyState icon="pin" title={emptyTitle}>
              The first verified sites go live city by city with the founding owners. Leave your
              email and we will tell you the day {what} appear.
            </EmptyState>
            {!p.followed ? (
              <FollowForm city={city} format={format} query={q} returnTo={here} what={what} />
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href="/for-owners/" variant="ghost" size="sm">
                Own sites here? List them free
              </Button>
              <Button href="/guides/" variant="ghost" size="sm">
                Read the cost guides
              </Button>
            </div>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="t-display-sm">Try a search like</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {EXAMPLES.map((e) => (
                  <li key={e}>
                    <a href={searchUrl({ q: e })} className="oh-link t-body">
                      {e}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="t-display-sm">What every result shows</h2>
              <ul className="text-ink-muted t-body mt-3 flex flex-col gap-2">
                {[
                  { icon: "pin" as const, t: "The exact spot, with a photo from the road" },
                  { icon: "hoarding" as const, t: "Format, size, lighting and screen specs" },
                  { icon: "verified" as const, t: "The verified owner, named on the page" },
                  {
                    icon: "enquiry" as const,
                    t: "A price, or “price on request”, and one-step enquiry",
                  },
                ].map((r) => (
                  <li key={r.t} className="flex items-start gap-2">
                    <span className="text-ink mt-0.5 shrink-0">
                      <Icon name={r.icon} size={20} />
                    </span>
                    <span>{r.t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </Shell>
  );
}

function stripFacet(q: string, slug: string): string {
  const names = [...CITY_OPTIONS, ...FORMAT_OPTIONS].find((o) => o.slug === slug)?.names ?? [slug];
  let out = q;
  for (const n of [...names].sort((a, b) => b.length - a.length))
    out = out.replace(new RegExp(`\\b${n}\\b`, "ig"), " ");
  return out.replace(/\s+/g, " ").trim();
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
