import type { Media, Person, Source } from "@/payload-types";
import { absolute } from "@/lib/seo";
import { formatDate } from "./format";
import { refId, rootOf, type FactFields, type LexNode } from "./lexical";
import { picture } from "./media";
import { PILLARS, pillarOf } from "./pillars";
import type { Piece } from "./queries";

/**
 * A piece as clean Markdown, for AI agents and assistants that fetch a page for someone: the same
 * words as the page, with every figure written out as "value (source N, as of date)" and a numbered
 * sources list, so a model can quote a figure with its source and date and never lose either.
 * Nothing here is generated copy; it is the editor's own text in another format.
 */
export interface MarkdownContext {
  sourceNumber: Map<number, number>;
  sources: Source[];
  media: Map<number, Media>;
  people: Map<number, Person>;
}

const FORMAT = { bold: 1, italic: 2, strike: 4, code: 16 } as const;

/** Characters that would turn plain text into emphasis, code or a link are escaped; nothing else. */
const escape = (text: string): string => text.replace(/([\\`*_[\]])/g, "\\$1");

function text(node: LexNode): string {
  const raw = node.text ?? "";
  const f = typeof node.format === "number" ? node.format : 0;
  if (f & FORMAT.code) return `\`${raw.replace(/`/g, "'")}\``;
  let out = escape(raw);
  if (!out.trim()) return out;
  if (f & FORMAT.strike) out = `~~${out}~~`;
  if (f & FORMAT.italic) out = `_${out}_`;
  if (f & FORMAT.bold) out = `**${out}**`;
  return out;
}

function docHref(relationTo: unknown, value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const doc = value as { slug?: string | null; pillar?: string | null };
  if (!doc.slug) return null;
  if (relationTo === "people") return absolute(`/authors/${doc.slug}/`);
  const pillar = typeof relationTo === "string" ? pillarOf(relationTo, doc) : undefined;
  return pillar ? absolute(`${PILLARS[pillar].path}/${doc.slug}/`) : null;
}

function link(node: LexNode, ctx: MarkdownContext): string {
  const inner = inline(node.children, ctx);
  const fields = (node.fields ?? {}) as {
    url?: string;
    linkType?: string;
    doc?: { relationTo?: unknown; value?: unknown };
  };
  const href =
    fields.linkType === "internal"
      ? docHref(fields.doc?.relationTo, fields.doc?.value)
      : /^https?:|^mailto:/i.test(fields.url ?? "")
        ? fields.url!
        : fields.url?.startsWith("/")
          ? absolute(fields.url)
          : null;
  return href ? `[${inner}](${href})` : inner;
}

function fact(fields: FactFields, ctx: MarkdownContext): string {
  const id = refId(fields.source);
  const n = id !== undefined ? ctx.sourceNumber.get(id) : undefined;
  const value = `${fields.value}${fields.unit ? ` ${fields.unit}` : ""}`;
  const where = [n ? `source ${n}` : null, fields.asOf ? `as of ${formatDate(fields.asOf)}` : null]
    .filter(Boolean)
    .join(", ");
  return where ? `${escape(value)} (${where})` : escape(value);
}

function inline(nodes: LexNode[] | undefined, ctx: MarkdownContext): string {
  return (nodes ?? [])
    .map((n) => {
      switch (n.type) {
        case "text":
          return text(n);
        case "linebreak":
          return "  \n";
        case "tab":
          return " ";
        case "link":
        case "autolink":
          return link(n, ctx);
        case "inlineBlock":
          return n.fields?.blockType === "fact" ? fact(n.fields as unknown as FactFields, ctx) : "";
        default:
          return inline(n.children, ctx);
      }
    })
    .join("");
}

function list(node: LexNode, ctx: MarkdownContext, depth: number): string {
  const ordered = node.tag === "ol" || node.listType === "number";
  const pad = "  ".repeat(depth);
  let n = 0;
  return (node.children ?? [])
    .map((item) => {
      const nested = (item.children ?? []).filter((c) => c.type === "list");
      const own = (item.children ?? []).filter((c) => c.type !== "list");
      // A list item that only holds a nested list continues the numbering of its parent.
      if (!own.length && nested.length)
        return nested.map((l) => list(l, ctx, depth + 1)).join("\n");
      n += 1;
      const bullet = ordered ? `${n}.` : "-";
      const line = `${pad}${bullet} ${inline(own, ctx).trim()}`;
      return [line, ...nested.map((l) => list(l, ctx, depth + 1))].join("\n");
    })
    .join("\n");
}

function figure(fields: Record<string, unknown>, ctx: MarkdownContext): string {
  const id = refId(fields.media);
  const media =
    typeof fields.media === "object" && fields.media !== null
      ? (fields.media as Media)
      : id !== undefined
        ? ctx.media.get(id)
        : undefined;
  const pic = picture(media, "hero");
  if (!pic) return "";
  const caption = typeof fields.caption === "string" ? fields.caption.trim() : "";
  return `![${escape(pic.alt)}](${absolute(pic.src)})\n\n_${caption ? `${escape(caption)} · ` : ""}Photo: ${escape(pic.credit)}_`;
}

function quote(fields: Record<string, unknown>, ctx: MarkdownContext): string {
  const id = refId(fields.person);
  const person =
    typeof fields.person === "object" && fields.person !== null
      ? (fields.person as Person)
      : id !== undefined
        ? ctx.people.get(id)
        : undefined;
  const name = person?.name ?? (typeof fields.name === "string" ? fields.name : "");
  const role = person?.role ?? (typeof fields.role === "string" ? fields.role : "");
  const said = `> ${escape(String(fields.text ?? "")).replace(/\n/g, "\n> ")}`;
  return name ? `${said}\n>\n> — ${escape(name)}${role ? `, ${escape(role)}` : ""}` : said;
}

function block(node: LexNode, ctx: MarkdownContext): string {
  switch (node.type) {
    case "paragraph":
      return inline(node.children, ctx).trim();
    case "heading":
      return `${node.tag === "h2" ? "##" : "###"} ${inline(node.children, ctx).trim()}`;
    case "list":
      return list(node, ctx, 0);
    case "quote":
      return `> ${inline(node.children, ctx).trim()}`;
    case "horizontalrule":
      return "---";
    case "block": {
      const fields = node.fields ?? {};
      if (fields.blockType === "figure") return figure(fields, ctx);
      if (fields.blockType === "quote") return quote(fields, ctx);
      if (fields.blockType === "callout") {
        const label =
          fields.kind === "warning" ? "Warning" : fields.kind === "charter" ? "Charter" : "Note";
        return `> **${label}:** ${escape(String(fields.body ?? ""))}`;
      }
      return "";
    }
    default:
      return node.children ? blocks(node.children, ctx) : "";
  }
}

function blocks(nodes: LexNode[] | undefined, ctx: MarkdownContext): string {
  return (nodes ?? [])
    .map((n) => block(n, ctx))
    .filter((s) => s.trim())
    .join("\n\n");
}

/** The body of a piece alone, as Markdown. */
export function bodyMarkdown(body: unknown, ctx: MarkdownContext): string {
  return blocks(rootOf(body)?.children, ctx);
}

const yaml = (value: string): string => JSON.stringify(value);

/** The whole piece: a short header of facts about it, the text, then its numbered sources. */
export function pieceMarkdown(piece: Piece, ctx: MarkdownContext): string {
  const url = absolute(piece.url);
  const pillar = PILLARS[piece.pillar];
  const header = [
    "---",
    `title: ${yaml(piece.title)}`,
    `url: ${yaml(url)}`,
    `section: ${yaml(pillar.label)}`,
    `published: ${yaml(piece.publishedAt)}`,
    `updated: ${yaml(piece.updatedAt)}`,
    `authors: [${piece.authors.map((a) => yaml(a.name)).join(", ")}]`,
    ...(piece.factCheckedBy && piece.factCheckedAt
      ? [
          `fact_checked_by: ${yaml(piece.factCheckedBy)}`,
          `fact_checked_on: ${yaml(piece.factCheckedAt)}`,
        ]
      : []),
    ...(piece.places.length
      ? [`places: [${piece.places.map((p) => yaml(p.name)).join(", ")}]`]
      : []),
    ...(piece.tags.length ? [`topics: [${piece.tags.map((t) => yaml(t.name)).join(", ")}]`] : []),
    ...(piece.sponsor ? [`sponsored_by: ${yaml(piece.sponsor)}`] : []),
    "publisher: OOHWORKS",
    "---",
  ].join("\n");

  const byline = `By ${piece.authors.map((a) => a.name).join(", ") || "OOHWORKS"} · ${formatDate(piece.publishedAt)}`;
  const parts = [
    header,
    `# ${escape(piece.title)}`,
    `_${escape(piece.standfirst)}_`,
    byline,
    ...(piece.sponsor ? [`**Sponsored by ${escape(piece.sponsor)}.**`] : []),
    ...(piece.shortAnswer ? [`**Short answer:** ${escape(piece.shortAnswer)}`] : []),
    bodyMarkdown(piece.body, ctx),
    ...(piece.methodNotes ? ["## Method", bodyMarkdown(piece.methodNotes, ctx)] : []),
  ];
  if (ctx.sources.length) {
    parts.push(
      "## Sources",
      ctx.sources
        .map((s, i) => {
          const date = s.publishedOn ? `, ${formatDate(s.publishedOn)}` : "";
          const title = `${escape(s.publisher)}: ${escape(s.title)}${date}`;
          return `${i + 1}. ${s.url ? `[${title}](${s.url})` : title}`;
        })
        .join("\n"),
    );
  }
  parts.push(
    `---\n\nThe page this copy is made from: ${url}\nPublished by OOHWORKS, which never sells media or takes a media margin. Quote figures with their source and date.`,
  );
  return `${parts.filter((p) => p.trim()).join("\n\n")}\n`;
}
