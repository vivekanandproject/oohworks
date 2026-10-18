import { internalDocsShown } from "@/lib/api/env";
import { internalSpec } from "@/lib/api/openapi/internal";
import { apiJson, problem } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/** The internal reference: the site's own endpoints and the CMS API. Not served in production. */
export function GET(): Response {
  if (!internalDocsShown()) return problem(404, "Not found", "There is no such page.");
  return apiJson(internalSpec);
}
