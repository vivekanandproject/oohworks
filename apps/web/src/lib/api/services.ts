import type { Payload } from "payload";
import { anthropicHeaders } from "@/lib/anthropic";
import { provider as placesProvider } from "@/lib/places";
import { siteEnv } from "./env";

/**
 * What this environment is connected to, for staff: each service's state, how it answered just now,
 * and where its dashboard is. Every check is free and read-only: nothing is sent, nothing is billed.
 */

export type ServiceState = "ok" | "off" | "failing" | "not used yet";

export interface ServiceReport {
  name: string;
  state: ServiceState;
  detail: string;
  ms: number | null;
  dashboard: string | null;
}

const LIMIT_MS = 3000;

async function timed(
  probe: () => Promise<string>,
): Promise<{ ok: boolean; detail: string; ms: number }> {
  const start = Date.now();
  try {
    const detail = await Promise.race([
      probe(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error(`no answer in ${LIMIT_MS / 1000} s`)), LIMIT_MS),
      ),
    ]);
    return { ok: true, detail, ms: Date.now() - start };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      ms: Date.now() - start,
    };
  }
}

async function probeUrl(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(LIMIT_MS), cache: "no-store" });
}

async function database(payload: Payload): Promise<ServiceReport> {
  const r = await timed(async () => {
    const { totalDocs } = await payload.count({ collection: "sites", overrideAccess: true });
    return `${totalDocs} sites`;
  });
  return {
    name: "Database",
    state: r.ok ? "ok" : "failing",
    detail: r.detail,
    ms: r.ms,
    dashboard: "https://console.cloud.google.com/sql/instances",
  };
}

async function email(): Promise<ServiceReport> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ohworks <enquiries@ohworks.com>";
  if (!key)
    return {
      name: "Email (Resend)",
      state: "off",
      detail: "No RESEND_API_KEY: emails are kept in the Outbox.",
      ms: null,
      dashboard: "/admin/collections/outbox/",
    };
  // Listing domains is free. A send-only key is refused with a name that still proves the key is real.
  const r = await timed(async () => {
    const res = await probeUrl("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${key}` },
    });
    const body = (await res.json().catch(() => ({}))) as {
      name?: string;
      data?: { name: string; status: string }[];
    };
    if (res.ok) {
      const domains = (body.data ?? []).map((d) => `${d.name} ${d.status}`).join(", ");
      return `Key works. Domains: ${domains || "none"}. Sends from ${from}.`;
    }
    if (body.name === "restricted_api_key")
      return `Send-only key works. Sends from ${from}; its domain must be verified in Resend.`;
    throw new Error(`Resend refused the key (${res.status}${body.name ? `, ${body.name}` : ""}).`);
  });
  return {
    name: "Email (Resend)",
    state: r.ok ? "ok" : "failing",
    detail: r.detail,
    ms: r.ms,
    dashboard: "https://resend.com/emails",
  };
}

async function places(): Promise<ServiceReport> {
  const which = placesProvider();
  const text = {
    google: "Google Places, with the key. Not called here: each search is billed.",
    photon: "Photon (OpenStreetMap), the keyless stand-in for development.",
    local: "The short list of cities held in the code. Set GOOGLE_MAPS_API_KEY for real use.",
  }[which];
  return {
    name: "Place search",
    state: which === "local" ? "off" : "ok",
    detail: text,
    ms: null,
    dashboard: which === "google" ? "https://console.cloud.google.com/google/maps-apis" : null,
  };
}

async function mapStyle(): Promise<ServiceReport> {
  const url = process.env.MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/positron";
  const r = await timed(async () => {
    const res = await probeUrl(url);
    if (!res.ok) throw new Error(`The map style answered ${res.status}.`);
    return process.env.MAP_STYLE_URL
      ? "The licensed style answers."
      : "OpenFreeMap answers. Set MAP_STYLE_URL to a MapTiler style for production.";
  });
  return {
    name: "Map style",
    state: r.ok ? "ok" : "failing",
    detail: r.detail,
    ms: r.ms,
    dashboard: process.env.MAP_STYLE_URL ? "https://cloud.maptiler.com/" : null,
  };
}

async function claude(): Promise<ServiceReport> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return {
      name: "Claude",
      state: "off",
      detail: "No ANTHROPIC_API_KEY: typed searches use the built-in rules only.",
      ms: null,
      dashboard: null,
    };
  // Listing models is free.
  const r = await timed(async () => {
    const res = await probeUrl("https://api.anthropic.com/v1/models?limit=1", {
      headers: anthropicHeaders(key),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (/workspace/i.test(body.error?.message ?? ""))
        throw new Error(
          "The key is not scoped to a workspace: set ANTHROPIC_WORKSPACE_ID, or use a workspace key.",
        );
      throw new Error(`Anthropic refused the key (${res.status}).`);
    }
    return `Key works. Reads typed searches with ${process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5"}.`;
  });
  return {
    name: "Claude",
    state: r.ok ? "ok" : "failing",
    detail: r.detail,
    ms: r.ms,
    dashboard: "https://console.anthropic.com/",
  };
}

function storage(): ServiceReport {
  const on = Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET,
  );
  return {
    name: "Photo storage",
    state: on ? "ok" : "off",
    detail: on
      ? `Cloudflare R2, bucket ${process.env.R2_BUCKET}.`
      : "On this machine's disk. A host with no disk needs the R2 settings.",
    ms: null,
    dashboard: on ? "https://dash.cloudflare.com/?to=/:account/r2" : null,
  };
}

function errors(): ServiceReport {
  return {
    name: "Error reports (Sentry)",
    state: process.env.SENTRY_DSN ? "ok" : "off",
    detail: process.env.SENTRY_DSN
      ? "Errors are reported."
      : "No SENTRY_DSN: errors go to the server log only.",
    ms: null,
    dashboard: process.env.SENTRY_DSN ? "https://sentry.io/" : null,
  };
}

const PLANNED: ServiceReport[] = [
  {
    name: "Redis",
    detail: "Shared rate limits and page cache, before production runs more than one instance.",
  },
  {
    name: "Jobs (Inngest)",
    detail: "Saved-search emails, availability reminders, the newsletter.",
  },
  { name: "Search index (Typesense)", detail: "When inventory passes a few thousand sites." },
].map((s) => ({ ...s, state: "not used yet" as const, ms: null, dashboard: null }));

export async function serviceReports(payload: Payload) {
  const services = [
    ...(await Promise.all([database(payload), email(), places(), mapStyle(), claude()])),
    storage(),
    errors(),
    ...PLANNED,
  ];
  return {
    environment: siteEnv(),
    checkedAt: new Date().toISOString(),
    healthy: services.every((s) => s.state !== "failing"),
    services,
  };
}
