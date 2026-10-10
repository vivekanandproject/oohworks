import { NextResponse } from "next/server";
import { isPermanentId } from "@ohworks/core";
import { rateLimited, safePath } from "@/lib/forms";
import { siteUrl } from "@/lib/seo";
import { sameOrigin } from "@/lib/sites/enquiry";
import {
  LISTS,
  LIST_SECONDS,
  addIds,
  isListName,
  parseIds,
  toggleId,
  writeIds,
  type ListName,
} from "@/lib/sites/lists";
import { planText, summarise } from "@/lib/sites/plan";
import { listingsFor } from "@/lib/sites/queries";

export const dynamic = "force-dynamic";

function cookieValue(req: Request, name: string): string | undefined {
  const all = req.headers.get("cookie") ?? "";
  for (const part of all.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/**
 * Saves a site to the buyer's shortlist, or ticks it for comparing. The lists live in the buyer's own
 * browser; nothing is stored about them here. A page with script gets the new state back as data;
 * a page without is sent back to where it was.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const wantsData = (req.headers.get("accept") ?? "").includes("application/json");
  const back = safePath(form.get("return"), "/shortlist/");
  const name = String(form.get("list") ?? "");
  if (!isListName(name) || rateLimited(req, "lists", 120)) {
    return wantsData
      ? Response.json({ error: "Try again in a minute." }, { status: 429 })
      : new Response(null, { status: 303, headers: { Location: back } });
  }

  const lists: Record<ListName, string[]> = {
    saved: parseIds(cookieValue(req, LISTS.saved.cookie), LISTS.saved.max),
    compare: parseIds(cookieValue(req, LISTS.compare.cookie), LISTS.compare.max),
  };
  const action = String(form.get("action") ?? "toggle");
  const id = String(form.get("id") ?? "").toLowerCase();
  let on = false;
  let full = false;

  if (action === "clear") {
    lists[name] = [];
  } else if (action === "add") {
    // Several at once: "Save all" from a compare view or a shared shortlist. Only sites that exist are kept.
    const asked = parseIds(String(form.get("ids") ?? ""), LISTS[name].max);
    const real = (await listingsFor(asked)).map((l) => l.permanentId);
    lists[name] = addIds(lists[name], real, LISTS[name].max);
  } else if (isPermanentId(id)) {
    if (action === "remove") {
      lists[name] = lists[name].filter((x) => x !== id);
    } else if (lists[name].includes(id) || (await listingsFor([id])).length === 1) {
      const change = toggleId(lists[name], id, LISTS[name].max);
      lists[name] = change.ids;
      on = change.on;
      full = change.full;
    }
  }

  const res = wantsData
    ? NextResponse.json({
        list: name,
        id,
        on,
        full,
        saved: lists.saved,
        compare: lists.compare,
        text: planText(summarise(await listingsFor(lists.saved))),
      })
    : new NextResponse(null, {
        status: 303,
        headers: { Location: full && name === "compare" ? "/compare/?full=1" : back },
      });
  for (const key of ["saved", "compare"] as const) {
    res.cookies.set(LISTS[key].cookie, writeIds(lists[key]), {
      httpOnly: true,
      sameSite: "lax",
      secure: siteUrl().startsWith("https://"),
      path: "/",
      maxAge: LIST_SECONDS,
    });
  }
  return res;
}
