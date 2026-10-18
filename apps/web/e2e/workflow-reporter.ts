import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";

/**
 * A plain summary of a workflow run (e2e/*.workflow.ts), for people rather than for debugging: each
 * stage with its outcome and time, what it checked, and the database rows it read. Written after every
 * run, passed or failed, to playwright-report/workflow/summary.html, beside Playwright's own report
 * (index.html), which keeps the traces.
 */

const OUT = path.resolve("playwright-report/workflow/summary.html");

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const secs = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;
/** Playwright's error messages carry terminal colours. */
const plain = (s: string): string => s.replace(/\u001b\[[0-9;]*m/g, "");

interface Stage {
  n: number;
  title: string;
  ok: boolean;
  ran: boolean;
  ms: number;
  error: string | null;
  checks: string[];
  rows: { name: string; json: string }[];
}

export default class WorkflowReporter implements Reporter {
  private runs: { test: TestCase; result: TestResult }[] = [];
  private baseURL = "";
  private started = new Date();

  onBegin(config: FullConfig): void {
    this.baseURL = String(config.projects[0]?.use?.baseURL ?? "");
    this.started = new Date();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.runs.push({ test, result });
  }

  onEnd(full: FullResult): void {
    const sections = this.runs.map(({ test, result }) => this.section(test, result));
    const passed = full.status === "passed";
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Workflow test report</title>
<style>
:root { --paper:#f6f5f2; --raised:#fff; --sunken:#ecebe6; --ink:#101c30; --muted:#56606f; --hair:#d9d8d2;
  --navy:#1d3a66; --ok:#1c7a4c; --okt:#dcf2e6; --crit:#b4321c; --critt:#f9e0db; --lit:#8a5d00; --litt:#fbeccb; }
* { box-sizing: border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font:15px/23px Archivo, system-ui, -apple-system, sans-serif; }
.wrap { max-width:1040px; margin:0 auto; padding:0 16px 56px; }
header { padding:36px 0 22px; border-bottom:1px solid var(--hair); margin-bottom:22px; }
.eyebrow { font:500 12px/16px "IBM Plex Mono", ui-monospace, monospace; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin:0 0 8px; }
h1 { font-size:clamp(26px,4.5vw,38px); line-height:1.1; letter-spacing:-.02em; margin:0 0 10px; font-weight:800; }
h2 { font-size:21px; line-height:28px; margin:30px 0 4px; }
p { margin:0 0 10px; }
.muted { color:var(--muted); }
.facts { display:flex; flex-wrap:wrap; gap:8px 22px; font-size:14px; color:var(--muted); margin-top:12px; }
.facts b { color:var(--ink); font-weight:600; }
.pill { display:inline-flex; align-items:center; gap:6px; font:500 11px/16px "IBM Plex Mono", ui-monospace, monospace; text-transform:uppercase; letter-spacing:.05em; padding:3px 9px; border-radius:999px; white-space:nowrap; }
.pill::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; }
.pill.ok { color:var(--ok); background:var(--okt); } .pill.no { color:var(--crit); background:var(--critt); } .pill.skip { color:var(--muted); background:var(--sunken); }
ol.stages { list-style:none; padding:0; margin:14px 0 0; display:grid; gap:10px; }
.stage { background:var(--raised); border:1px solid var(--hair); border-radius:8px; padding:14px 16px; }
.stage.no { border-color:var(--crit); }
.top { display:grid; grid-template-columns:34px 1fr auto; gap:10px; align-items:start; }
.num { font:600 14px/22px "IBM Plex Mono", ui-monospace, monospace; color:var(--muted); }
.title { font-weight:600; }
.side { display:flex; gap:10px; align-items:center; font:13px/20px "IBM Plex Mono", ui-monospace, monospace; color:var(--muted); }
.chips { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 0 44px; }
.chip { font-size:12px; line-height:18px; padding:1px 8px; border-radius:4px; background:var(--sunken); color:var(--navy); }
.error { margin:10px 0 0 44px; background:var(--critt); color:var(--crit); border-radius:6px; padding:10px 12px; font:12px/18px "IBM Plex Mono", ui-monospace, monospace; white-space:pre-wrap; overflow-wrap:anywhere; }
details { margin:10px 0 0 44px; }
summary { cursor:pointer; color:var(--navy); font-size:14px; min-height:28px; }
pre { background:var(--sunken); border-radius:6px; padding:10px 12px; font:12px/18px "IBM Plex Mono", ui-monospace, monospace; overflow-x:auto; margin:6px 0 10px; }
.rowname { font-size:13px; color:var(--muted); margin-top:8px; }
a { color:var(--navy); }
@media (max-width:560px) { .top { grid-template-columns:26px 1fr; } .side { grid-column:2; } .chips,.error,details { margin-left:0; } }
</style>
</head>
<body>
<div class="wrap">
<header>
  <p class="eyebrow">ohworks · workflow test · ${esc(this.started.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }))} India time</p>
  <h1>The marketplace loop, end to end</h1>
  <p class="muted">One owner and one buyer, from the owner's first visit to a site taken down. Each stage is checked on the screen, in the email the site sends (the Outbox), in the public API and in the database rows themselves.</p>
  <div class="facts">
    <span><span class="pill ${passed ? "ok" : "no"}">${passed ? "Passed" : "Failed"}</span></span>
    <span>Took <b>${secs(full.duration)}</b></span>
    <span>Server <b>${esc(this.baseURL)}</b></span>
    <span>Database <b>ohworks_test</b></span>
  </div>
</header>
${sections.join("\n")}
<p class="muted" style="margin-top:28px">Traces, screenshots and every step in detail: <a href="index.html">Playwright's report</a>. Run it again with <code>pnpm test:workflow</code> in apps/web.</p>
</div>
</body>
</html>`;
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileSync(OUT, html);
    console.log(`\n  Workflow summary: ${OUT}\n`);
  }

  private section(test: TestCase, result: TestResult): string {
    const steps = result.steps.filter((s: TestStep) => s.category === "test.step");
    const attached = result.attachments
      .filter((a) => a.body && /^\d+ · /.test(a.name))
      .map((a) => ({
        n: Number(a.name.split(" · ")[0]),
        name: a.name.split(" · ").slice(1).join(" · "),
        body: a.body!.toString("utf8"),
      }));
    const stages: Stage[] = steps.map((s) => {
      const n = Number(/^(\d+)\./.exec(s.title)?.[1] ?? -1);
      return {
        n,
        title: s.title.replace(/^\d+\.\s*/, ""),
        ok: !s.error,
        ran: true,
        ms: s.duration,
        error: s.error?.message ? plain(s.error.message).slice(0, 1500) : null,
        checks: attached
          .filter((a) => a.n === n && a.name === "checks")
          .flatMap((a) => JSON.parse(a.body) as string[]),
        rows: attached
          .filter((a) => a.n === n && a.name !== "checks")
          .map((a) => ({ name: a.name, json: a.body })),
      };
    });
    const failed = stages.filter((s) => !s.ok).length;
    const outside = result.errors
      .map((e) => plain(e.message ?? ""))
      .filter((m) => m && !stages.some((s) => s.error && m.startsWith(s.error.slice(0, 80))));
    return `<h2>${esc(test.title)}</h2>
<p class="muted">${stages.length} stages · ${stages.length - failed} passed${failed ? ` · ${failed} failed` : ""} · ${secs(result.duration)}</p>
<ol class="stages">
${stages
  .map(
    (s) => `<li class="stage ${s.ok ? "" : "no"}">
  <div class="top"><span class="num">${s.n}</span><span class="title">${esc(s.title)}</span>
    <span class="side">${secs(s.ms)} <span class="pill ${s.ok ? "ok" : "no"}">${s.ok ? "Passed" : "Failed"}</span></span></div>
  ${s.checks.length ? `<div class="chips">${s.checks.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : ""}
  ${s.error ? `<div class="error">${esc(s.error)}</div>` : ""}
  ${
    s.rows.length
      ? `<details><summary>What the database held (${s.rows.length})</summary>${s.rows
          .map((r) => `<div class="rowname">${esc(r.name)}</div><pre>${esc(r.json)}</pre>`)
          .join("")}</details>`
      : ""
  }
</li>`,
  )
  .join("\n")}
</ol>
${outside.length ? `<div class="error" style="margin-left:0;margin-top:12px">${esc(outside.join("\n\n").slice(0, 2000))}</div>` : ""}`;
  }
}
