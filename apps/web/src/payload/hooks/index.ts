import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
} from "payload";
import { pieceUrl, pillarOf } from "../../lib/editorial/pillars";
import { canPublish } from "../access";
import { pingWebSub } from "../../lib/editorial/websub";
import { pingIndexNow } from "../../lib/indexnow";

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
  if (operation === "create" && req.user) data.createdBy = req.user.id;
  if (!data.slug && typeof data.title === "string") data.slug = slugify(data.title);
  if (data.body) data.readingTime = Math.max(1, Math.round(wordCount(data.body) / 200));

  // Who checked it, and when: recorded as the piece reaches Fact-checked, cleared if it goes back
  // to draft or review, and kept through scheduling and publishing.
  const reachedCheck = data.workflow === "fact_checked" && originalDoc?.workflow !== "fact_checked";
  if (reachedCheck && req.user) {
    const user = req.user as { id: number; name?: string | null; email?: string | null };
    data.factCheck = {
      by: user.name || user.email || "An editor",
      at: new Date().toISOString(),
      user: user.id,
    };
  } else if (data.workflow === "draft" || data.workflow === "in_review") {
    data.factCheck = { by: null, at: null, user: null };
  }

  const publishing = data._status === "published";
  if (publishing) {
    if (!canPublish(req.user)) {
      throw new APIError(
        "Only an editor, an admin or a super admin can publish. Move the piece to review instead.",
        403,
      );
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

/** The home page is cached; drop it when anything public changes. Outside a Next request (seed scripts) there is nothing to drop. */
async function refreshHome(): Promise<void> {
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
  } catch {
    // Not inside a Next request.
  }
}

function publicPath(
  collection: string,
  doc: { slug?: string | null; pillar?: string | null } | undefined,
): string | undefined {
  if (!doc?.slug) return undefined;
  const pillar = pillarOf(collection, doc);
  return pillar ? pieceUrl(pillar, doc.slug) : undefined;
}

export const refreshAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  collection,
}) => {
  const isPublic = doc?._status === "published";
  const wasPublic = previousDoc?._status === "published";
  if (isPublic || wasPublic) {
    await refreshHome();
    if (isPublic) {
      void pingIndexNow([publicPath(collection.slug, doc), "/newsroom/", "/"]);
      void pingWebSub();
    }
  }
  return doc;
};

export const refreshAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  if (doc?._status === "published") await refreshHome();
  return doc;
};
