import { timingSafeEqual } from "node:crypto";
import { JOBS, type JobName } from "@/lib/jobs";

export const dynamic = "force-dynamic";
// Claude can take several minutes over a long media kit; the service allows 15 (infra/terraform).
export const maxDuration = 900;

const notFound = () => new Response("Not found", { status: 404 });

function authorised(req: Request, secret: string): boolean {
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Runs one job on the timer (src/lib/jobs). Only with `Authorization: Bearer <CRON_SECRET>`; without
 * CRON_SECRET set, there are no jobs here at all.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ job: string }> },
): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return notFound();
  const { job } = await params;
  if (!authorised(req, secret)) return new Response("Unauthorised", { status: 401 });
  if (!(job in JOBS)) return notFound();
  const started = Date.now();
  const result = await JOBS[job as JobName].run();
  return Response.json(
    { job, ok: true, ...result, ms: Date.now() - started },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
