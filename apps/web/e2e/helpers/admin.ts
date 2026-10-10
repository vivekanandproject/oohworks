import type { APIRequestContext } from "@playwright/test";

export interface Mail {
  subject: string;
  text: string;
}

/** The headers for the admin API, from the one session the whole run shares (see global-setup.ts). */
export async function adminHeaders(request: APIRequestContext): Promise<{ Authorization: string }> {
  const shared = process.env.OHWORKS_ADMIN_TOKEN;
  if (shared) return { Authorization: `JWT ${shared}` };
  // Only reached when a test file is run without the global setup.
  const login = await request.post("/api/users/login", {
    data: {
      email: "admin@ohworks.local",
      password: process.env.SEED_ADMIN_PASSWORD ?? "ohworks-admin-local",
    },
  });
  if (!login.ok()) throw new Error(`The seeded admin could not sign in (${login.status()}).`);
  return { Authorization: `JWT ${((await login.json()) as { token: string }).token}` };
}

/** Emails written to the outbox, newest first. Nothing is really sent on a machine with no email service. */
export async function mails(request: APIRequestContext, to: string, kind: string): Promise<Mail[]> {
  const res = await request.get(
    `/api/outbox?where[to][equals]=${encodeURIComponent(to)}&where[kind][equals]=${kind}&sort=-createdAt&limit=40`,
    { headers: await adminHeaders(request) },
  );
  if (!res.ok()) throw new Error(`Reading the outbox answered ${res.status()}.`);
  return ((await res.json()) as { docs: Mail[] }).docs;
}
