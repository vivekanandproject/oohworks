import { countWords, factsIn, nodeText, rootOf, walk, type LexNode } from "./lexical";

/**
 * Whether a piece is ready for search engines, answer engines and AI agents: the checks in
 * docs/oohworks-article-discoverability-plan.md section 3. Advice only (decided 24 Oct 2026): nothing
 * here stops publishing; the fact-check gate in the editorial hook still does. Plain code, so the
 * CMS panel and the tests share one set of rules.
 */
export interface ReadinessInput {
  /** articles or guides */
  collection: string;
  /** news, analysis, academy, showcase; guides for a guide */
  pillar: string;
  title: string;
  slug: string;
  standfirst: string;
  shortAnswer: string;
  seoDescription: string;
  body: unknown;
  authors: number;
  places: number;
  tags: number;
  layout: string;
  hero: { width: number; alt: string; credit: string } | null;
  /** The site's own address, to tell an internal link from an outbound one. */
  siteHost: string;
}

export interface ReadinessCheck {
  key: string;
  label: string;
  ok: boolean;
  /** What to do, when the check is not met. */
  fix: string;
}

const words = (text: string): number => text.split(/\s+/).filter(Boolean).length;

/** Pillars whose readers come with a question, so the piece should answer it first. */
const ANSWERS = new Set(["news", "analysis", "academy", "guides"]);
/** Pillars that need some length to be worth ranking. */
const LONG = new Set(["analysis", "academy", "guides"]);

function links(body: unknown, siteHost: string): { internal: number; outbound: number } {
  let internal = 0;
  let outbound = 0;
  walk(rootOf(body), (n: LexNode) => {
    if (n.type !== "link" && n.type !== "autolink") return;
    const f = (n.fields ?? {}) as { linkType?: string; url?: string };
    if (f.linkType === "internal") internal += 1;
    else if (f.url?.startsWith("/")) internal += 1;
    else if (/^https?:/i.test(f.url ?? "")) {
      try {
        if (new URL(f.url!).host === siteHost) internal += 1;
        else outbound += 1;
      } catch {
        // Not a link anyone can follow.
      }
    }
  });
  return { internal, outbound };
}

/** True when an h3 comes before any h2: the headings skip a level. */
function headingsSkip(body: unknown): boolean {
  let seenH2 = false;
  let skips = false;
  walk(rootOf(body), (n) => {
    if (n.type !== "heading") return;
    if (n.tag === "h2") seenH2 = true;
    else if (!seenH2) skips = true;
  });
  return skips;
}

/** Sentences of more than 30 words in the body. */
function longSentences(body: unknown): number {
  const root = rootOf(body);
  if (!root) return 0;
  let n = 0;
  for (const child of root.children ?? []) {
    if (child.type !== "paragraph") continue;
    for (const s of nodeText(child).split(/(?<=[.!?])\s+/)) if (words(s) > 30) n += 1;
  }
  return n;
}

export function readiness(i: ReadinessInput): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];
  const add = (key: string, label: string, ok: boolean, fix: string) =>
    checks.push({ key, label, ok, fix });

  const t = i.title.trim().length;
  add(
    "title",
    "Title is 30 to 90 characters",
    t >= 30 && t <= 90,
    t < 30
      ? `Add ${30 - t} characters: say who, what and where.`
      : `Cut ${t - 90} characters; long titles are cut off in results.`,
  );

  const s = i.standfirst.trim().length;
  add(
    "standfirst",
    "Standfirst is 80 to 300 characters",
    s >= 80 && s <= 300,
    s < 80
      ? "Give the key fact and its date in one or two sentences."
      : "Shorten it to one or two sentences.",
  );

  if (ANSWERS.has(i.pillar)) {
    const w = words(i.shortAnswer);
    add(
      "short-answer",
      "Short answer is 40 to 60 words",
      w >= 40 && w <= 60,
      w === 0
        ? "Write 40 to 60 words that answer the headline's question, with the key figure and its date. Answer engines quote this."
        : w < 40
          ? `Add ${40 - w} words: the figure, its source and its date.`
          : `Cut ${w - 60} words; keep the answer, drop the background.`,
    );
  }

  const description = i.seoDescription.trim() || i.standfirst.trim();
  add(
    "description",
    "Search description is under 160 characters",
    description.length > 0 && description.length <= 160,
    "Fill in the SEO description (under 160 characters); the standfirst is too long to stand in for it.",
  );

  add(
    "slug",
    "Address is short and plain",
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(i.slug) &&
      i.slug.length <= 70 &&
      !/\b(19|20)\d{2}-\d{2}\b/.test(i.slug),
    "Use lowercase words joined by hyphens, under 70 characters, without dates.",
  );

  const facts = factsIn(i.body);
  const unchecked = facts.filter((f) => f.checked !== true).length;
  add(
    "facts",
    facts.length
      ? `Every figure is checked (${facts.length - unchecked} of ${facts.length})`
      : "Figures are Fact blocks with a source",
    facts.length ? unchecked === 0 : true,
    `${unchecked} figure${unchecked === 1 ? " is" : "s are"} not yet ticked against ${unchecked === 1 ? "its" : "their"} source. Publishing waits for this.`,
  );

  if (i.hero) {
    add(
      "hero",
      "Hero photo is at least 1200 px wide, with alt text and credit",
      i.hero.width >= 1200 && Boolean(i.hero.alt.trim()) && Boolean(i.hero.credit.trim()),
      i.hero.width < 1200
        ? `The photo is ${i.hero.width} px wide; Google Discover and large previews need 1200 px.`
        : "Add alt text describing what the photo shows, and the photographer's credit.",
    );
  } else if (i.layout === "immersive") {
    add(
      "hero",
      "Immersive layout has a hero photo",
      false,
      "Add a real hero photo, or switch the layout to Standard.",
    );
  }

  add(
    "authors",
    "An author is named",
    i.authors > 0,
    "Add the author, so the byline links to who wrote it.",
  );
  add(
    "filed",
    "Filed under a place or topic",
    i.places + i.tags > 0,
    "Add at least one place or topic tag, so the piece joins its topic pages.",
  );
  add(
    "headings",
    "Headings run in order",
    !headingsSkip(i.body),
    "Start sections with a large heading (H2); use H3 only inside one.",
  );

  const { internal, outbound } = links(i.body, i.siteHost);
  add(
    "internal-links",
    "Links to two other OOHWORKS pages",
    internal >= 2,
    `Link ${2 - internal} more related piece, guide, city page or site page.`,
  );
  add(
    "outbound",
    "Links to a primary source",
    outbound >= 1 || facts.length > 0,
    "Link the report, filing or announcement this piece is based on.",
  );

  if (LONG.has(i.pillar)) {
    const w = countWords(i.body);
    add(
      "length",
      "Body is 300 words or more",
      w >= 300,
      `The body has ${w} words; pieces this kind rank with 300 or more.`,
    );
  }

  const long = longSentences(i.body);
  add(
    "sentences",
    "Sentences stay under 30 words",
    long === 0,
    `${long} sentence${long === 1 ? " runs" : "s run"} over 30 words; split ${long === 1 ? "it" : "them"}.`,
  );

  return checks;
}
