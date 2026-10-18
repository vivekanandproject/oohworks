import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { BasketEnhance, ListSync } from "@/components/sites/Basket";
import { PlanBar } from "@/components/sites/PlanBar";
import { QuickView } from "@/components/sites/QuickView";
import { SiteCard } from "@/components/sites/SiteCard";
import { formatDate } from "@/lib/editorial/format";
import { absolute, alternates, JsonLd } from "@/lib/seo";
import { readLists } from "@/lib/sites/lists-server";
import { planText, summarise } from "@/lib/sites/plan";
import { listingsFor, ownerPage } from "@/lib/sites/queries";

/**
 * An owner's public page: who they are and every site they have published, with the same cards as
 * search. A free storefront to share with buyers. Contact details are never shown; buyers ask about a
 * site from its card. Search engines see it only for a verified owner with a site above the content bar.
 */

type Params = { slug: string };

const pageOf = (raw: string | string[] | undefined): number => {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n > 1 && n < 1000 ? n : 1;
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pageOf((await searchParams).page);
  const data = await ownerPage(slug, page);
  if (!data) return {};
  const where = data.cities.map((c) => c.label).join(", ");
  const sites = `${data.total} ${data.total === 1 ? "site" : "sites"}`;
  return {
    title: `${data.owner.name}: ${sites} for outdoor advertising${where ? ` in ${where}` : ""}`,
    description: `${data.owner.name} sells ${sites}${where ? ` in ${where}` : ""} on ohworks. See each one's size, price, photographs and availability, and ask the owner directly.`,
    alternates: alternates(`/owners/${slug}/`),
    // Further pages repeat the first one's content; only the first, of a real owner, is for search engines.
    robots: data.indexable && page === 1 ? undefined : { index: false, follow: true },
  };
}

export default async function OwnerPublicPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { slug } = await params;
  const page = pageOf((await searchParams).page);
  const data = await ownerPage(slug, page);
  if (!data || (page > 1 && page > data.pages)) notFound();
  const { owner } = data;
  const now = Date.now();
  const lists = await readLists();
  const plan = planText(summarise(await listingsFor(lists.saved)));
  const here = `/owners/${slug}/${page > 1 ? `?page=${page}` : ""}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: owner.name,
    url: absolute(`/owners/${slug}/`),
    ...(owner.about ? { description: owner.about } : {}),
    ...(data.cities.length
      ? { areaServed: data.cities.map((c) => ({ "@type": "City", name: c.label })) }
      : {}),
  };

  return (
    <Shell active="find">
      {data.indexable ? <JsonLd data={jsonLd} /> : null}
      <BasketEnhance />
      <ListSync />
      <QuickView />
      <Container className="pt-6 pb-14">
        <nav aria-label="Breadcrumb" className="t-small text-ink-muted" data-section="breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <a href="/search/" className="oh-link">
                Find sites
              </a>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <span aria-current="page">{owner.name}</span>
            </li>
          </ol>
        </nav>

        <h1 className="t-display-lg mt-4" data-section="owner-title">
          {owner.name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-1" data-section="owner-badges">
          {owner.verified ? (
            <Badge kind="verified">Verified owner</Badge>
          ) : (
            <Badge kind="neutral">Owner not yet verified</Badge>
          )}
          {owner.medianReplyHours != null && owner.medianReplyHours < 24 ? (
            <Badge kind="responsive">Replies in under a day</Badge>
          ) : null}
          {owner.sample ? <Badge kind="neutral">Sample owner</Badge> : null}
        </div>
        <p className="t-body-lg text-ink mt-4 max-w-[68ch]" data-section="owner-fact">
          {data.total} {data.total === 1 ? "site" : "sites"} on ohworks
          {data.cities.length ? ` in ${data.cities.map((c) => c.label).join(", ")}` : ""}
          {data.formats.length
            ? `: ${data.formats.map((f) => `${f.count} ${f.label.toLowerCase()}`).join(", ")}`
            : ""}
          .
        </p>
        {owner.verified && owner.verifiedOn ? (
          <p className="t-small text-ink-muted mt-2">
            Company documents and contact details checked on {formatDate(owner.verifiedOn)}.
          </p>
        ) : null}
        {owner.about ? (
          <p className="t-body text-ink mt-4 max-w-[68ch]" data-section="owner-about">
            {owner.about}
          </p>
        ) : null}
        <p className="t-small text-ink-muted mt-4 max-w-[68ch]">
          Every enquiry goes straight to {owner.name}. ohworks never sells media or takes a margin.
        </p>

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-8 pb-4">
          <h2 className="t-display-sm" data-section="heading">
            {data.pages > 1
              ? `Sites ${(page - 1) * 12 + 1} to ${(page - 1) * 12 + data.cards.length} of ${data.total}`
              : data.total === 1
                ? "The one site listed"
                : `All ${data.total} sites`}
          </h2>
          <a
            href={`/search/?owner=${slug}`}
            className="oh-link t-body"
            rel="nofollow"
            data-action="filter-these"
          >
            Filter and sort these sites
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-section="results">
          {data.cards.map((card) => (
            <SiteCard
              key={card.site.id}
              card={card}
              now={now}
              lists={lists}
              back={here}
              level={3}
            />
          ))}
        </div>

        {data.pages > 1 ? (
          <nav
            aria-label="Pages"
            className="border-hairline mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
            data-section="pager"
          >
            {page > 1 ? (
              <a
                href={page === 2 ? `/owners/${slug}/` : `/owners/${slug}/?page=${page - 1}`}
                className="oh-link t-body"
              >
                Previous
              </a>
            ) : (
              <span />
            )}
            <span className="t-small text-ink-muted">
              Page {page} of {data.pages}
            </span>
            {page < data.pages ? (
              <a href={`/owners/${slug}/?page=${page + 1}`} className="oh-link t-body">
                Next
              </a>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Container>
      <PlanBar text={plan} saved={lists.saved.length} compare={lists.compare.length} />
    </Shell>
  );
}
