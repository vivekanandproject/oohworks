/** Helpers for reading the Lexical JSON an editor writes. Pure functions, no rendering. */
export interface LexNode {
  type?: string;
  tag?: string;
  text?: string;
  format?: number | string;
  listType?: string;
  children?: LexNode[];
  fields?: Record<string, unknown>;
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface FactFields {
  value: string;
  unit?: string | null;
  source: unknown;
  asOf: string;
  label?: string | null;
  checked?: boolean | null;
}

export function rootOf(body: unknown): LexNode | undefined {
  const root = (body as { root?: LexNode } | null | undefined)?.root;
  return root && typeof root === "object" ? root : undefined;
}

export function walk(node: LexNode | undefined, visit: (n: LexNode) => void): void {
  if (!node) return;
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function isBlockOf(node: LexNode, blockType: string): boolean {
  return (
    (node.type === "inlineBlock" || node.type === "block") && node.fields?.blockType === blockType
  );
}

/** The readable text of a node, including the figures of any Fact inside it. */
const BLOCK_TYPES = new Set(["paragraph", "heading", "list", "listitem", "quote", "block"]);

export function nodeText(node: LexNode): string {
  let out = "";
  walk(node, (n) => {
    // Block-level nodes are separate runs of text; without a space between them their words would join.
    if (n.type && BLOCK_TYPES.has(n.type)) out += " ";
    if (typeof n.text === "string") out += n.text;
    else if (isBlockOf(n, "fact")) {
      const f = n.fields as unknown as FactFields;
      out += `${f.value ?? ""}${f.unit ? ` ${f.unit}` : ""}`;
    }
  });
  return out.replace(/\s+/g, " ").trim();
}

export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "section";
}

/** Every h2 and h3 with a stable, unique id. The map lets the renderer give each node the same id. */
export function headingIndex(body: unknown): { list: Heading[]; ids: WeakMap<object, string> } {
  const list: Heading[] = [];
  const ids = new WeakMap<object, string>();
  const used = new Map<string, number>();
  walk(rootOf(body), (n) => {
    if (n.type !== "heading") return;
    const text = nodeText(n);
    if (!text) return;
    const base = slugifyHeading(text);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    const id = seen === 0 ? base : `${base}-${seen + 1}`;
    ids.set(n, id);
    list.push({ id, text, level: n.tag === "h2" ? 2 : 3 });
  });
  return { list, ids };
}

/** Fields of every block or inline block of one type, in reading order. */
export function blockFields(body: unknown, blockType: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  walk(rootOf(body), (n) => {
    if (isBlockOf(n, blockType) && n.fields) out.push(n.fields);
  });
  return out;
}

export function factsIn(body: unknown): FactFields[] {
  return blockFields(body, "fact") as unknown as FactFields[];
}

export function countWords(body: unknown): number {
  const root = rootOf(body);
  if (!root) return 0;
  return nodeText(root).split(/\s+/).filter(Boolean).length;
}

/** A relationship value is either an id or a populated document. */
export function refId(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && typeof (value as { id?: unknown }).id === "number")
    return (value as { id: number }).id;
  return undefined;
}

/** A plain-text summary of the opening of a body, for descriptions and feeds. */
export function excerpt(body: unknown, max = 280): string {
  const root = rootOf(body);
  if (!root) return "";
  const first = (root.children ?? []).find((c) => c.type === "paragraph" && nodeText(c).length > 0);
  const text = first ? nodeText(first) : "";
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
