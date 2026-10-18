import { publicSpec } from "@/lib/api/openapi/public-v1";
import { apiJson } from "@/lib/api/respond";

/** The public API's description, as OpenAPI 3.1. */
export function GET(): Response {
  return apiJson(publicSpec, 300);
}
