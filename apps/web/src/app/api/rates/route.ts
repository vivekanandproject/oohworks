/**
 * Exchange rates for the approximate figure beside a price, refreshed once a day. They come from
 * ExchangeRate-API's open endpoint (attribution required, no key), against the US dollar, with the
 * date they were published. A converted figure is only ever shown as approximate, beside the owner's
 * own price; it is never stored, sent to an owner or used in an enquiry.
 */
export const revalidate = 86400;

const SOURCE = "https://open.er-api.com/v6/latest/USD";

interface Upstream {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
}

export async function GET() {
  try {
    const res = await fetch(SOURCE, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as Upstream;
    if (body.result !== "success" || !body.rates) throw new Error("no rates");
    const date = body.time_last_update_utc
      ? new Date(body.time_last_update_utc).toISOString().slice(0, 10)
      : null;
    return Response.json(
      {
        base: "USD",
        date,
        source: "ExchangeRate-API",
        sourceUrl: "https://www.exchangerate-api.com",
        rates: body.rates,
      },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
    );
  } catch {
    // Without rates the page shows the owner's price alone, which is always the real one.
    return Response.json({ rates: null }, { headers: { "Cache-Control": "public, max-age=600" } });
  }
}
