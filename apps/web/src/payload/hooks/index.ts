import { APIError, type CollectionBeforeChangeHook } from "payload";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type LexicalNode = {
  type?: string;
  text?: string;
  children?: LexicalNode[];
  fields?: Record<string, unknown>;
};

function walk(node: LexicalNode | undefined, visit: (n: LexicalNode) => void) {
  if (!node) return;
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/** Words in a Lexical document, counting plain text and block captions. */
export function wordCount(body: unknown): number {
  const root = (body as { root?: LexicalNode } | undefined)?.root;
  let words = 0;
  walk(root, (n) => {
    if (typeof n.text === "string") words += n.text.split(/\s+/).filter(Boolean).length;
  });
  return words;
}

/** Facts in a Lexical document that an editor has not yet ticked against their source. */
export function uncheckedFacts(body: unknown): number {
  const root = (body as { root?: LexicalNode } | undefined)?.root;
  let unchecked = 0;
  walk(root, (n) => {
    if (
      (n.type === "inlineBlock" || n.type === "block") &&
      n.fields?.blockType === "fact" &&
      n.fields.checked !== true
    )
      unchecked += 1;
  });
  return unchecked;
}

/** Sets slug, author, reading time; enforces the fact-check gate and who may publish. */
export const editorialBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const role = (req.user as { role?: string } | null)?.role;
  if (operation === "create" && req.user) data.createdBy = req.user.id;
  if (!data.slug && typeof data.title === "string") data.slug = slugify(data.title);
  if (data.body) data.readingTime = Math.max(1, Math.round(wordCount(data.body) / 200));

  const publishing = data._status === "published";
  if (publishing) {
    if (!["admin", "editor"].includes(role ?? "")) {
      throw new APIError("Only an editor can publish. Move the piece to review instead.", 403);
    }
    const unchecked = uncheckedFacts(data.body);
    if (unchecked > 0) {
      throw new APIError(
        `${unchecked} fact${unchecked === 1 ? " is" : "s are"} not yet checked against ${unchecked === 1 ? "its" : "their"} source. Tick each Fact block, then publish.`,
        400,
      );
    }
    if (!["fact_checked", "scheduled", "published"].includes(data.workflow ?? "")) {
      throw new APIError("The piece must be marked fact-checked before it is published.", 400);
    }
    data.workflow = "published";
    if (!data.publishedAt && !originalDoc?.publishedAt) data.publishedAt = new Date().toISOString();
  }
  return data;
};
