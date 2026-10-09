export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: process.env.SERVICE_ROLE ?? "web",
    time: new Date().toISOString(),
  });
}
