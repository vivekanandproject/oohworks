import { request, type FullConfig } from "@playwright/test";

/**
 * Signs in as the seeded admin once, before any test, and hands every worker the same session.
 * Tests read emails and tidy up through the admin API. If each signed in for itself, sign-ins made
 * at the same moment would overwrite one another's session and some requests would be turned away.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3100";
  const api = await request.newContext({ baseURL });
  const login = await api.post("/api/users/login", {
    data: {
      email: "admin@ohworks.local",
      password: process.env.SEED_ADMIN_PASSWORD ?? "ohworks-admin-local",
    },
  });
  if (!login.ok())
    throw new Error(
      `The seeded admin could not sign in (${login.status()}). Run pnpm test:db first.`,
    );
  process.env.OHWORKS_ADMIN_TOKEN = ((await login.json()) as { token: string }).token;
  await api.dispose();
}
