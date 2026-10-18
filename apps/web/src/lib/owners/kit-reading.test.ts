import ExcelJS from "exceljs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KitReadError, planKit, readKit, sitesFromAnswer, type KitSite } from "./kit-reading";
import { readSheet } from "./sheet";
import { sitesBook } from "./sheet-book";

const TODAY = "2026-10-18";

/** A site as Claude would give it: every field present, empty where the kit says nothing. */
const entry = (fields: Record<string, unknown>) => ({
  page: 3,
  ownerRef: "",
  format: "Hoarding",
  width: "40",
  height: "20",
  unit: "ft",
  lighting: "Front-lit",
  litHours: "",
  city: "Bengaluru",
  locality: "Hebbal",
  road: "Bellary Road",
  landmark: "",
  lat: "",
  lng: "",
  place: "",
  traffic: "towards the airport",
  rate: "120000",
  minPeriod: "",
  productionCost: "",
  notAccepted: "",
  bookedUntil: "",
  permitNumber: "",
  permitAuthority: "",
  permitExpires: "",
  artworkSpec: "",
  fileTypes: "",
  leadTimeDays: "",
  resolution: "",
  spotSeconds: "",
  loopSeconds: "",
  advertisers: "",
  ratePerSqFt: "",
  unsure: [],
  ...fields,
});

describe("what Claude read, made safe to use", () => {
  it("keeps the kit's fields and drops values off this site's lists", () => {
    const { sites, notes } = sitesFromAnswer({
      sites: [
        entry({ format: "Spaceship", unsure: ["road", "secret"], page: 2.5, extra: "x" }),
        entry({ format: "", width: "", height: "", city: "", locality: "", road: "" }),
        "not a site",
      ],
      notes: "  Page 9 lists sites that are sold.  ",
    });
    expect(notes).toBe("Page 9 lists sites that are sold.");
    expect(sites).toHaveLength(2);
    expect(sites[0]!.raw.format).toBeUndefined();
    expect(sites[0]!.raw.road).toBe("Bellary Road");
    expect(sites[0]!.raw).not.toHaveProperty("extra");
    expect(sites[0]!.unsure).toEqual(["road"]);
    expect(sites[0]!.page).toBe(0);
  });

  it("works out a monthly rate from a square-foot price, and marks it to check", () => {
    const { sites } = sitesFromAnswer({
      sites: [
        entry({ rate: "", ratePerSqFt: "₹ 45" }),
        entry({ rate: "", ratePerSqFt: "40", unit: "m", width: "10", height: "5" }),
        entry({ rate: "90000", ratePerSqFt: "45" }),
      ],
      notes: "",
    });
    expect(sites[0]!.raw.rate).toBe("36000");
    expect(sites[0]!.unsure).toContain("rate");
    expect(sites[1]!.raw.rate).toBe(String(Math.round(40 * 50 * 10.7639)));
    expect(sites[2]!.raw.rate).toBe("90000");
    expect(sites[2]!.unsure).not.toContain("rate");
  });

  it("drafts what passes the site checks, and hands back the rest with what is missing", () => {
    const read = sitesFromAnswer({
      sites: [
        entry({ ownerRef: "HB-1", lat: "13.04", lng: "77.59" }),
        entry({ ownerRef: "HB-2" }),
        entry({ ownerRef: "hb-1", place: "13.05, 77.60", page: 5 }),
      ],
      notes: "",
    }).sites;
    const plan = planKit(read, TODAY);
    expect(plan.ready.map((r) => r.site.ownerRef)).toEqual(["HB-1"]);
    expect(plan.ready[0]!.site.rate).toBe(120000);
    expect(plan.needs).toHaveLength(2);
    expect(plan.needs[0]!.problems.lat).toMatch(/latitude/);
    expect(plan.needs[1]!.problems.ownerRef).toMatch(/also on page 3/);
  });
});

describe("the spreadsheet of sites to finish", () => {
  it("marks each gap, and reads back as the same sites when uploaded", async () => {
    const sites: KitSite[] = sitesFromAnswer({
      sites: [entry({ ownerRef: "HB-2" }), entry({ ownerRef: "HB-3", road: "" })],
      notes: "",
    }).sites;
    const needs = planKit(sites, TODAY).needs;
    const data = await sitesBook(needs.map((n) => ({ ...n, from: "Page 3 of your media kit" })));
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(data);
    const sheet = book.getWorksheet("Sites")!;
    const header = (sheet.getRow(1).values as unknown[]).slice(1);
    const col = (name: string) => header.indexOf(name) + 1;
    const second = sheet.getRow(3);
    expect(second.getCell(col("Road")).note).toBeTruthy();
    expect(String(second.getCell(col("Map link")).note)).toMatch(/Google Maps link/);
    expect((second.getCell(col("Latitude")).fill as ExcelJS.FillPattern).fgColor?.argb).toBe(
      "FFFBE3B4",
    );
    expect(sheet.getRow(2).getCell(1).note).toBe("Page 3 of your media kit");

    // The owner adds the positions, and the file goes through the ordinary upload.
    sheet.getRow(2).getCell(col("Map link")).value = "13.04, 77.59";
    second.getCell(col("Map link")).value = "13.05, 77.60";
    second.getCell(col("Road")).value = "Bellary Road";
    const rows: unknown[][] = [];
    for (let n = 2; n <= sheet.rowCount; n += 1)
      rows.push((sheet.getRow(n).values as unknown[]).slice(1));
    const read = readSheet(header, rows, TODAY);
    expect(read.problems).toEqual([]);
    expect(read.sites.map((s) => s.site.ownerRef)).toEqual(["HB-2", "HB-3"]);
  });
});

/** Anthropic's streamed answer, as server-sent events. */
const streamed = (text: string, stop = "end_turn") => {
  const events = [
    {
      type: "message_start",
      message: {
        id: "msg_1",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 5200, output_tokens: 1 },
      },
    },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: stop, stop_sequence: null },
      usage: { output_tokens: 640 },
    },
    { type: "message_stop" },
  ];
  return new Response(
    events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(""),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
};

describe("asking Claude to read a kit", () => {
  beforeEach(() => vi.stubEnv("ANTHROPIC_API_KEY", "test-key"));
  afterEach(() => vi.unstubAllEnvs());

  const PDF = new TextEncoder().encode("%PDF-1.7 a media kit");
  const about = { ownerName: "Kaveri Outdoor", note: "Rates are for October.", today: TODAY };

  it("sends the PDF with the schema, and reads back the sites", async () => {
    vi.stubEnv("ANTHROPIC_WORKSPACE_ID", "wrkspc_test");
    const fetcher = vi.fn(async () =>
      streamed(JSON.stringify({ sites: [entry({ ownerRef: "HB-1" })], notes: "One site." })),
    );
    const got = await readKit(PDF, about, fetcher as unknown as typeof fetch);
    expect(got.sites.map((s) => s.raw.ownerRef)).toEqual(["HB-1"]);
    expect(got.notes).toBe("One site.");
    expect(got.tokens).toEqual({ input: 5200, output: 640 });

    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toMatch(/\/v1\/messages\?beta=true$/);
    const headers = new Headers(init.headers);
    expect(headers.get("x-api-key")).toBe("test-key");
    expect(headers.get("anthropic-workspace-id")).toBe("wrkspc_test");
    expect(headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    const body = JSON.parse(String(init.body)) as {
      model: string;
      stream: boolean;
      fallbacks: unknown;
      output_config: { effort: string; format: { type: string; schema: unknown } };
      messages: { content: { type: string; source?: { data: string }; text?: string }[] }[];
    };
    expect(body.model).toBe("claude-opus-5-5");
    expect(body.stream).toBe(true);
    expect(body.fallbacks).toBe("default");
    expect(body.output_config.format.type).toBe("json_schema");
    const [doc, words] = body.messages[0]!.content;
    expect(doc!.type).toBe("document");
    expect(Buffer.from(doc!.source!.data, "base64").toString()).toBe("%PDF-1.7 a media kit");
    expect(words!.text).toContain("Rates are for October.");
    expect(words!.text).toContain(`Today is ${TODAY}`);
  });

  it("treats a refusal, a cut-off answer, a refused key and stray text as failures", async () => {
    const fail = async (res: Response) =>
      readKit(PDF, about, (async () => res) as unknown as typeof fetch).catch((e: unknown) => e);
    expect(await fail(streamed("", "refusal"))).toBeInstanceOf(KitReadError);
    expect(await fail(streamed('{"sites": [', "max_tokens"))).toBeInstanceOf(KitReadError);
    expect(await fail(streamed("Here are the sites:"))).toBeInstanceOf(KitReadError);
    const denied = await fail(
      new Response(
        JSON.stringify({
          type: "error",
          error: { type: "authentication_error", message: "invalid x-api-key" },
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
    );
    expect(denied).toBeInstanceOf(KitReadError);
    expect(String((denied as Error).message)).toMatch(/401/);
  });
});
