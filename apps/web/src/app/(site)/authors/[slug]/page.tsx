import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Button, Container, EmptyState } from "@ohworks/ui";
import type { Media } from "@/payload-types";
import { Shell } from "@/components/Shell";
import { PieceRow } from "@/components/editorial/PieceBits";
import { formatDate } from "@/lib/editorial/format";
import { breadcrumbJsonLd, personJsonLd } from "@/lib/editorial/jsonld";
import { picture } from "@/lib/editorial/media";
import { getPerson, piecesByAuthor } from "@/lib/editorial/queries";
import { JsonLd, alternates } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const person = await getPerson((await params).slug);
  if (!person?.slug) return {};
  const pieces = await piecesByAuthor(person.id, 1);
  return {
    title: person.name,
    description: `${person.role}. ${person.bio}`.slice(0, 158),
    alternates: alternates(`/authors/${person.slug}/`),
    robots: pieces.length === 0 ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function AuthorPage({ params }: Params) {
  const person = await getPerson((await params).slug);
  if (!person?.slug) notFound();
  const pieces = await piecesByAuthor(person.id);
  const photo =
    typeof person.photo === "object" && person.photo !== null
      ? picture(person.photo as Media, "thumb")
      : null;
  return (
    <Shell active="news">
      <JsonLd
        data={[
          personJsonLd(person),
          breadcrumbJsonLd([
            { name: "Newsroom", path: "/newsroom/" },
            { name: person.name, path: `/authors/${person.slug}/` },
          ]),
        ]}
      />
      <Container className="py-10 lg:py-14">
        <div className="mx-auto max-w-[760px]">
          <nav aria-label="Breadcrumb" className="t-small text-ink-muted">
            <a className="oh-link" href="/newsroom/">
              Newsroom
            </a>
          </nav>
          <header className="mt-4 flex items-start gap-5">
            {photo ? (
              <img
                src={photo.src}
                alt=""
                width={96}
                height={96}
                className="rounded-pill bg-paper-sunken h-24 w-24 shrink-0 object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="rounded-pill bg-navy font-display text-on-navy grid h-24 w-24 shrink-0 place-items-center text-[36px] font-bold"
              >
                {person.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="t-display-lg">{person.name}</h1>
              <p className="t-body text-ink-muted mt-2">{person.role}</p>
              {person.verified ? (
                <p className="mt-3">
                  <Badge kind="verified">
                    Verified contributor
                    {person.verifiedAt ? ` · checked ${formatDate(person.verifiedAt)}` : ""}
                  </Badge>
                </p>
              ) : null}
            </div>
          </header>
          <p className="t-body-lg text-ink mt-6">{person.bio}</p>
          {person.credentials?.length ? (
            <ul className="t-body text-ink-muted mt-4 list-disc pl-6">
              {person.credentials.map((c) => (
                <li key={c.id ?? c.item}>{c.item}</li>
              ))}
            </ul>
          ) : null}
          {person.links?.length ? (
            <p className="t-body mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {person.links.map((l) => (
                <a key={l.id ?? l.url} href={l.url} className="oh-link" rel="noopener me">
                  {l.label}
                </a>
              ))}
            </p>
          ) : null}

          <section className="mt-10" data-section="stream">
            <h2 className="t-display-md pb-4">Pieces by {person.name}</h2>
            {pieces.length ? (
              pieces.map((p) => <PieceRow key={`${p.collection}-${p.id}`} piece={p} />)
            ) : (
              <EmptyState
                icon="enquiry"
                title="Nothing published yet"
                actions={
                  <Button href="/newsroom/" variant="primary" size="sm">
                    Back to the newsroom
                  </Button>
                }
              >
                Their first piece appears here the day it is published.
              </EmptyState>
            )}
          </section>
        </div>
      </Container>
    </Shell>
  );
}
