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
