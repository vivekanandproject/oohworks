import { checkNewPassword } from "@/lib/owners/password";
import { go, ownerGate } from "@/lib/owners/request";
import { setPassword } from "@/lib/owners/server";

export const dynamic = "force-dynamic";

/** A signed-in owner sets or changes the password they sign in with. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "password");
  if (!gate.ok) return gate.response;
  const owner = gate.owner;
  if (!owner) return go("/owner/company/");
  const after = gate.form.get("after") === "code" ? "&after=code" : "";
  const weak = checkNewPassword(String(gate.form.get("password") ?? ""), gate.email);
  if (weak) return go(`/owner/password/?error=${weak}${after}`);
  await setPassword(owner, String(gate.form.get("password")));
  return go("/owner/?saved=password");
}
