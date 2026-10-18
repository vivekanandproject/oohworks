import Anthropic from "@anthropic-ai/sdk";

/**
 * Headers for Anthropic's API. A key that is not scoped to a workspace (one that starts sk-ant-usr-)
 * must also name the workspace to use, from ANTHROPIC_WORKSPACE_ID.
 */
export function anthropicHeaders(key: string): Record<string, string> {
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID;
  return {
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    ...(workspace ? { "anthropic-workspace-id": workspace } : {}),
  };
}

/**
 * Anthropic's client, for the long calls (reading a media kit) that stream. The same key and workspace
 * as anthropicHeaders. `fetch` is for tests.
 */
export function anthropicClient(
  options: { fetch?: typeof fetch | undefined; timeoutMs?: number } = {},
) {
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID;
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(workspace ? { defaultHeaders: { "anthropic-workspace-id": workspace } } : {}),
    ...(options.fetch ? { fetch: options.fetch } : {}),
    timeout: options.timeoutMs ?? 14 * 60 * 1000,
    maxRetries: 1,
  });
}
