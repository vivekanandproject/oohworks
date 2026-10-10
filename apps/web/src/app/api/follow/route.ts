import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const LIMIT = 30;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

function safeReturn(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/search/";
  return value.split("#")[0]!;
}

function withParam(path: string, key: string, val: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.delete("followed");
  url.searchParams.delete("follow");
  url.searchParams.set(key, val);
  return `${url.pathname}${url.search}`;
}

/** Records a follow from the search page. Honeypot-filled and rate-limited posts succeed silently. */
export async function POST(req: Request) {
  const form = await req.formData();
  const back = safeReturn(String(form.get("return") ?? ""));
  const redirect = (key: string, val: string) =>
    new Response(null, { status: 303, headers: { Location: withParam(back, key, val) } });

  if (String(form.get("company") ?? "")) return redirect("followed", "1");

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  if (limited(ip)) return redirect("followed", "1");

  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254)
    return redirect("follow", "invalid");

  const city = String(form.get("city") ?? "").slice(0, 40);
  const format = String(form.get("format") ?? "").slice(0, 40);
  const query = String(form.get("q") ?? "").slice(0, 200);

  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: "follows",
    where: {
      and: [
        { email: { equals: email } },
        { city: { equals: city } },
        { format: { equals: format } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: "follows",
      data: { email, city, format, query, source: "search" },
      overrideAccess: true,
    });
  }
  return redirect("followed", "1");
}
