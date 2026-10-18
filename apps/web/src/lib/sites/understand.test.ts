import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkUnderstood, forgetUnderstood, readStateSmart, understand } from "./understand";

const TODAY = "2026-10-10";
const answer = (input: unknown, status = 200) =>
  vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          content: [
            { type: "text", text: "ok" },
            { type: "tool_use", name: "set_filters", input },
          ],
        }),
        { status },
      ),
  );

describe("checking what a model says", () => {
  it("keeps values from this site's own lists and drops the rest", () => {
    const got = checkUnderstood(
      {
        city: "bengaluru",
        formats: ["led-screen", "blimp"],
        lighting: ["digital", "neon"],
        type: "digital",
        size_w_ft: 20,
        size_h_ft: 10,
        max_rate: 200000,
        min_rate: 50000,
        from: "2026-11-01",
        to: "2026-11-30",
        trust: ["owner", "admin"],
        area: "Airport Road",
      },
      "big screens near airport road for diwali under 2 lakhs",
      TODAY,
    );
    expect(got).toEqual({
      city: "bengaluru",
      formats: ["led-screen"],
      lighting: ["digital"],
      type: "digital",
      size: { w: 20, h: 10 },
      min: 50000,
      max: 200000,
      from: "2026-11-01",
      to: "2026-11-30",
      trust: ["owner"],
      area: "airport road",
    });
  });
  it("refuses a city it does not serve, wild numbers, past dates and an end before the start", () => {
    const got = checkUnderstood(
      {
        city: "atlantis",
        formats: [],
        lighting: [],
        trust: [],
        size_w_ft: 2000,
        size_h_ft: 10,
        max_rate: 5,
        min_rate: -1,
        from: "2025-01-01",
        to: "2026-10-01",
      },
      "anything",
      TODAY,
    );
    expect(got).toEqual({});
    expect(checkUnderstood({ from: "2026-11-10", to: "2026-11-01" }, "x", TODAY)).toEqual({
      from: "2026-11-10",
    });
    expect(checkUnderstood({ min_rate: 300000, max_rate: 200000 }, "x", TODAY)).toEqual({
      max: 200000,
    });
  });
  it("keeps a place only when the buyer typed those words", () => {
    expect(
      checkUnderstood({ area: "Silk Board junction" }, "hoardings near silk board junction", TODAY)
        .area,
    ).toBe("silk board junction");
    expect(
      checkUnderstood({ area: "Koramangala 5th Block" }, "hoardings near silk board", TODAY).area,
    ).toBeUndefined();
    expect(
      checkUnderstood({ area: "<script>alert(1)</script>" }, "hoardings", TODAY).area,
    ).toBeUndefined();
    expect(checkUnderstood("not an object", "x", TODAY)).toEqual({});
    expect(checkUnderstood(null, "x", TODAY)).toEqual({});
  });
});

describe("asking Claude", () => {
  beforeEach(() => {
    forgetUnderstood();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("is never called without a key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const fetcher = answer({ formats: ["hoarding"], lighting: [], trust: [] });
    expect(await understand("screens near the airport", TODAY, fetcher)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
    const read = await readStateSmart(
      { q: "screens near the old airport road for diwali" },
      TODAY,
      fetcher,
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(read.state.formats).toEqual(["led-screen"]);
  });

  it("names the workspace when the key is not scoped to one", async () => {
    process.env.ANTHROPIC_WORKSPACE_ID = "wrkspc_test";
    try {
      const fetcher = answer({ formats: ["hoarding"], lighting: [], trust: [] });
      await understand("hoardings near the lake front", TODAY, fetcher);
      const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
      expect((init.headers as Record<string, string>)["anthropic-workspace-id"]).toBe(
        "wrkspc_test",
      );
    } finally {
      delete process.env.ANTHROPIC_WORKSPACE_ID;
    }
  });

  it("sends the query with a forced tool call and reads the answer back", async () => {
    const fetcher = answer({
      formats: ["led-screen"],
      lighting: [],
      trust: ["permit"],
      max_rate: 200000,
      area: "airport road",
    });
    const got = await understand(
      "big screens near airport road with a permit under 2 lakhs",
      TODAY,
      fetcher,
    );
    expect(got).toEqual({
      formats: ["led-screen"],
      trust: ["permit"],
      max: 200000,
      area: "airport road",
    });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
    expect(init.headers as Record<string, string>).not.toHaveProperty("anthropic-workspace-id");
    const body = JSON.parse(String(init.body)) as {
      model: string;
      tool_choice: unknown;
      messages: { content: string }[];
      system: string;
    };
    expect(body.model).toBe("claude-haiku-5-5");
    expect(body.tool_choice).toEqual({ type: "tool", name: "set_filters" });
    expect(body.messages[0]?.content).toBe(
      "big screens near airport road with a permit under 2 lakhs",
    );
    expect(body.system).toContain(`Today is ${TODAY}`);
  });

  it("remembers an answer, and does not remember a failure", async () => {
    const ok = answer({ formats: ["unipole"], lighting: [], trust: [] });
    await understand("single pole boards", TODAY, ok);
    await understand("Single  pole boards", TODAY, ok);
    expect(ok).toHaveBeenCalledTimes(1);

    const down = answer({}, 529);
    expect(await understand("tall boards by the lake", TODAY, down)).toBeNull();
    expect(await understand("tall boards by the lake", TODAY, down)).toBeNull();
    expect(down).toHaveBeenCalledTimes(2);
    const broken = vi.fn(async () => {
      throw new Error("timeout");
    });
    expect(await understand("boards by the fort", TODAY, broken)).toBeNull();
  });

  it("fills only the gaps: the buyer's own filters win, then the rules, then Claude", async () => {
    const fetcher = answer({
      city: "mumbai",
      formats: ["unipole"],
      lighting: [],
      trust: ["responsive"],
      max_rate: 900000,
      from: "2026-11-01",
      to: "2026-11-15",
      area: "old airport road",
    });
    const read = await readStateSmart(
      {
        q: "hoardings on old airport road in november from owners who reply fast",
        city: "bengaluru",
        max: "150000",
      },
      TODAY,
      fetcher,
    );
    expect(read.understood).toBe(true);
    expect(read.state.city).toBe("bengaluru");
    expect(read.state.max).toBe(150000);
    expect(read.state.formats).toEqual(["hoarding"]);
    expect(read.state.trust).toEqual(["responsive"]);
    expect(read.state.from).toBe("2026-11-01");
    expect(read.state.to).toBe("2026-11-15");
    expect(read.state.q).toBe("old airport road");
    expect(read.typed).toBe("hoardings on old airport road in november from owners who reply fast");
  });

  it("does not ask when the rules already placed every word", async () => {
    const fetcher = answer({ formats: ["gantry"], lighting: [], trust: [] });
    const read = await readStateSmart(
      { q: "20x10 hoardings in Bengaluru under 1 lakh" },
      TODAY,
      fetcher,
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(read.state.formats).toEqual(["hoarding"]);
  });
});
