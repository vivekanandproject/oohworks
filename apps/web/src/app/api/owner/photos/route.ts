import { MAX_BATCH, encodeBatch, type BatchResult } from "@/lib/owners/photo-batch";
import { readPhotoFacts } from "@/lib/owners/photo-facts";
import { placePhoto, viewOf } from "@/lib/owners/photo-match";
import { checkFile, go, ownerGate } from "@/lib/owners/request";
import { ownerSite, ownerSites } from "@/lib/owners/server";
import { takePhoto } from "@/lib/owners/take-photo";

export const dynamic = "force-dynamic";

/**
 * Photographs of many sites at once. Each is placed on the owner's site it was taken at, by the
 * position the phone recorded (src/lib/owners/photo-match.ts), and then gets every check a single
 * photograph gets. Those that cannot be placed are reported, for the owner to place by hand. A plain
 * form post comes back to /owner/photos/ with the outcome in the address; the page's script asks for
 * JSON, one photograph a request.
 */
export async function POST(req: Request) {
  const json = (req.headers.get("accept") ?? "").includes("application/json");
  const gate = await ownerGate(req, "photos", 60);
  if (!gate.ok) return gate.response;
  const { form, owner } = gate;
  if (!owner) return go("/owner/company/");
  const refuse = (error: string) =>
    json
      ? Response.json({ error }, { status: 400, headers: { "Cache-Control": "no-store" } })
      : go(`/owner/photos/?error=${error}`);
  const values = form.getAll("photos").filter((v) => !(v instanceof File) || v.size > 0);
  if (values.length === 0) return refuse("missing");
  if (values.length > MAX_BATCH) return refuse("many");

  const sites = (await ownerSites(owner.id)).filter((s) => s.permanentId && !s.removed);
  const results: BatchResult[] = [];
  for (const value of values) {
    const name = (value instanceof File ? value.name : "file").slice(0, 80);
    const picked = checkFile(value, "photo");
    if ("problem" in picked) {
      results.push({ name, added: false, reason: picked.problem });
      continue;
    }
    const bytes = new Uint8Array(await picked.file.arrayBuffer());
    const facts = await readPhotoFacts(bytes);
    const place = placePhoto(facts, sites);
    if ("reason" in place) {
      results.push({ name, added: false, reason: place.reason });
      continue;
    }
    // Read afresh: an earlier photograph in this batch may have gone to the same site.
    const site = await ownerSite(owner.id, place.site.permanentId!);
    if (!site) {
      results.push({ name, added: false, reason: "far" });
      continue;
    }
    const view = viewOf(
      facts,
      (site.photos ?? []).some((p) => p.kind === "approach"),
    );
    const done = await takePhoto(owner, site, picked.file, view, "", { bytes, facts });
    const unit = site.permanentId!;
    results.push(
      done.added
        ? { name, added: true, unit, ...(done.twin ? { twin: true } : {}) }
        : {
            name,
            added: false,
            unit,
            reason: done.problem,
            ...(done.library ? { library: done.library } : {}),
          },
    );
  }
  if (json) return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
  return go(`/owner/photos/?r=${encodeBatch(results)}`);
}
