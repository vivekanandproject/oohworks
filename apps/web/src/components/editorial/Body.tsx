import { Fragment, type ReactNode } from "react";
import type { Media, Person, Source } from "@/payload-types";
import { formatDate } from "@/lib/editorial/format";
import { refId, rootOf, type FactFields, type LexNode } from "@/lib/editorial/lexical";
import { picture } from "@/lib/editorial/media";
import { PILLARS, pillarOf } from "@/lib/editorial/pillars";

export interface BodyContext {
  headingIds: WeakMap<object, string>;
  sourceNumber: Map<number, number>;
  sources: Map<number, Source>;
  media: Map<number, Media>;
  people: Map<number, Person>;
}

const FORMAT = { bold: 1, italic: 2, strike: 4, underline: 8, code: 16, sub: 32, sup: 64 } as const;

function renderText(node: LexNode): ReactNode {
  let out: ReactNode = node.text ?? "";
  const f = typeof node.format === "number" ? node.format : 0;
  if (f & FORMAT.code) out = <code>{out}</code>;
  if (f & FORMAT.sub) out = <sub>{out}</sub>;
  if (f & FORMAT.sup) out = <sup>{out}</sup>;
  if (f & FORMAT.underline) out = <u>{out}</u>;
  if (f & FORMAT.strike) out = <s>{out}</s>;
  if (f & FORMAT.italic) out = <em>{out}</em>;
  if (f & FORMAT.bold) out = <strong>{out}</strong>;
  return out;
}

/** Where a link to another CMS document goes on the site. */
function docHref(relationTo: unknown, value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const doc = value as { slug?: string | null; pillar?: string | null };
  if (!doc.slug) return null;
  if (relationTo === "people") return `/authors/${doc.slug}/`;
  const pillar = typeof relationTo === "string" ? pillarOf(relationTo, doc) : undefined;
  return pillar ? `${PILLARS[pillar].path}/${doc.slug}/` : null;
}

function renderLink(node: LexNode, ctx: BodyContext, key: string): ReactNode {
  const fields = (node.fields ?? {}) as {
    url?: string;
    newTab?: boolean;
    linkType?: string;
    doc?: { relationTo?: unknown; value?: unknown };
  };
  const children = renderNodes(node.children, ctx, key);
  if (fields.linkType === "internal") {
    const href = docHref(fields.doc?.relationTo, fields.doc?.value);
    return href ? <a href={href}>{children}</a> : <>{children}</>;
  }
  const url = fields.url ?? "";
  if (!/^(https?:|mailto:|\/|#)/i.test(url)) return <>{children}</>;
  const external = /^https?:/i.test(url);
  return (
    <a
      href={url}
      {...(external ? { rel: "noopener", ...(fields.newTab ? { target: "_blank" } : {}) } : {})}
    >
      {children}
    </a>
  );
}

function Fact({ fields, ctx }: { fields: FactFields; ctx: BodyContext }) {
  const id = refId(fields.source);
  const source = id !== undefined ? ctx.sources.get(id) : undefined;
  const n = id !== undefined ? ctx.sourceNumber.get(id) : undefined;
  const title = source ? `${source.publisher}, as of ${formatDate(fields.asOf)}` : undefined;
  return (
    <span
      className={/\d/.test(fields.value) ? "oh-fact" : "oh-fact words"}
      title={title}
      data-fact=""
    >
      {fields.value}
      {fields.unit ? ` ${fields.unit}` : ""}
      {n ? (
        <a
          className="ref"
          href={`#src-${n}`}
          aria-label={`Source ${n}${source ? `: ${source.publisher}` : ""}`}
        >
          {n}
        </a>
      ) : null}
    </span>
  );
}

function Figure({ fields, ctx }: { fields: Record<string, unknown>; ctx: BodyContext }) {
  const id = refId(fields.media);
  const media =
    typeof fields.media === "object" && fields.media !== null
      ? (fields.media as Media)
      : id !== undefined
        ? ctx.media.get(id)
        : undefined;
  const pic = picture(media, "hero");
  if (!pic) return null;
  const caption = typeof fields.caption === "string" ? fields.caption : "";
  return (
    <figure className={fields.nightShot ? "night" : undefined}>
      <img
        src={pic.src}
        alt={pic.alt}
        width={pic.width}
        height={pic.height}
        loading="lazy"
        decoding="async"
      />
      <figcaption>
        {caption ? `${caption} · ` : ""}Photo: {pic.credit}
      </figcaption>
    </figure>
  );
}

function PullQuote({ fields, ctx }: { fields: Record<string, unknown>; ctx: BodyContext }) {
  const id = refId(fields.person);
  const person =
    typeof fields.person === "object" && fields.person !== null
      ? (fields.person as Person)
      : id !== undefined
        ? ctx.people.get(id)
        : undefined;
  const name = person?.name ?? (typeof fields.name === "string" ? fields.name : "");
  const role = person?.role ?? (typeof fields.role === "string" ? fields.role : "");
  return (
    <figure className="oh-pullquote">
      <blockquote style={{ border: 0, padding: 0 }}>
        <p>{String(fields.text ?? "")}</p>
      </blockquote>
      {name ? (
        <figcaption>
          {person?.slug ? <a href={`/authors/${person.slug}/`}>{name}</a> : name}
          {role ? `, ${role}` : ""}
        </figcaption>
      ) : null}
    </figure>
  );
}

function renderNode(node: LexNode, ctx: BodyContext, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return <Fragment key={key}>{renderText(node)}</Fragment>;
    case "linebreak":
      return <br key={key} />;
    case "tab":
      return <Fragment key={key}>{"\t"}</Fragment>;
    case "paragraph": {
      const children = renderNodes(node.children, ctx, key);
      return children.length ? <p key={key}>{children}</p> : null;
    }
    case "heading": {
      const Tag = node.tag === "h2" ? "h2" : "h3";
      return (
        <Tag key={key} id={ctx.headingIds.get(node)}>
          {renderNodes(node.children, ctx, key)}
        </Tag>
      );
    }
    case "list": {
      const Tag = node.tag === "ol" ? "ol" : "ul";
      return <Tag key={key}>{renderNodes(node.children, ctx, key)}</Tag>;
    }
    case "listitem":
      return <li key={key}>{renderNodes(node.children, ctx, key)}</li>;
    case "quote":
      return <blockquote key={key}>{renderNodes(node.children, ctx, key)}</blockquote>;
    case "horizontalrule":
      return <hr key={key} />;
    case "link":
    case "autolink":
      return <Fragment key={key}>{renderLink(node, ctx, key)}</Fragment>;
    case "inlineBlock":
      if (node.fields?.blockType === "fact")
        return <Fact key={key} fields={node.fields as unknown as FactFields} ctx={ctx} />;
      return null;
    case "block": {
      const fields = node.fields ?? {};
      if (fields.blockType === "figure") return <Figure key={key} fields={fields} ctx={ctx} />;
      if (fields.blockType === "quote") return <PullQuote key={key} fields={fields} ctx={ctx} />;
      if (fields.blockType === "callout") {
        const kind = fields.kind === "charter" || fields.kind === "warning" ? fields.kind : "note";
        return (
          <aside key={key} className={`oh-callout ${kind}`}>
            {String(fields.body ?? "")}
          </aside>
        );
      }
      return null;
    }
    default:
      return node.children ? (
        <Fragment key={key}>{renderNodes(node.children, ctx, key)}</Fragment>
      ) : null;
  }
}

function renderNodes(nodes: LexNode[] | undefined, ctx: BodyContext, prefix: string): ReactNode[] {
  return (nodes ?? [])
    .map((n, i) => renderNode(n, ctx, `${prefix}.${i}`))
    .filter((n) => n !== null);
}

/** The body of a piece, rendered from the editor's own structure. Nothing here is generated copy. */
export function Body({
  body,
  ctx,
  className,
}: {
  body: unknown;
  ctx: BodyContext;
  className?: string;
}) {
  const root = rootOf(body);
  if (!root) return null;
  return (
    <div className={`oh-prose ${className ?? ""}`}>{renderNodes(root.children, ctx, "n")}</div>
  );
}
