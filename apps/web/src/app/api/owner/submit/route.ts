import { go, ownerGate } from "@/lib/owners/request";
import { submitAll } from "@/lib/owners/server";

export const dynamic = "force-dynamic";

/** Sends the owner's drafts and returned sites to the ohworks team for their check. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "submit", 10);
  if (!gate.ok) return gate.response;
  if (!gate.owner) return go("/owner/company/");
  try {
    return go(`/owner/?sent=${await submitAll(gate.owner)}`);
  } catch {
    return go("/owner/?error=send");
  }
}
