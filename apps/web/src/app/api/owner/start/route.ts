import { cleanEmail, rateLimited, seeOther } from "@/lib/forms";
import { checkStart, type StartRaw } from "@/lib/owners/company-input";
import { checkNewPassword, hashPassword } from "@/lib/owners/password";
import { recentCodes, startCode } from "@/lib/owners/server";
import { sameOrigin } from "@/lib/sites/enquiry";

export const dynamic = "force-dynamic";

const field = (form: FormData, name: string, max: number): string =>
  String(form.get(name) ?? "")
    .trim()
    .slice(0, max);

/**
 * The first step of listing. From the start page it carries who is listing: the company, the person
 * and where enquiries go. From Sign in it carries the email alone. Either way a code is sent to
 * prove the address, and nothing is created until that code comes back.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const signIn = form.get("via") === "signin";
  const page = signIn ? "/sign-in/code/" : "/list-your-sites/";
  if (String(form.get("website") ?? "")) return seeOther(req, page);

  if (signIn) {
    if (rateLimited(req, "owner-start", 10)) return seeOther(req, `${page}?error=busy`);
    const email = cleanEmail(form.get("email"));
    if (!email) return seeOther(req, `${page}?error=email`);
    // One address can ask for five codes an hour, so the form cannot be used to flood someone's inbox.
    if ((await recentCodes(email, Date.now())) >= 5) return seeOther(req, `${page}?error=busy`);
    try {
      return seeOther(req, `/list-your-sites/confirm/?t=${await startCode(email)}&via=signin`);
    } catch {
      return seeOther(req, `${page}?error=send`);
    }
  }

  const raw: StartRaw = {
    name: field(form, "name", 80),
    placeLabel: field(form, "placeLabel", 160),
    placeId: field(form, "placeId", 300),
    placeLat: field(form, "placeLat", 24),
    placeLng: field(form, "placeLng", 24),
    placeCountry: field(form, "placeCountry", 2),
    contactName: field(form, "contactName", 80),
    phoneCountry: field(form, "phoneCountry", 2),
    phone: field(form, "phone", 32),
    email: field(form, "email", 254),
    gstin: field(form, "gstin", 40),
  };
  // A mistake returns to the form with everything that was typed.
  const back = (error: string) =>
    seeOther(req, `${page}?${new URLSearchParams({ error, ...raw }).toString()}`);
  if (rateLimited(req, "owner-start", 10)) return back("busy");
  const checked = checkStart(raw);
  if (!checked.ok) return back(checked.error);
  // The password is never put in an address or kept as typed. A mistake elsewhere on the form
  // sends the owner back without it, and what waits beside the code is its hash.
  const password = String(form.get("password") ?? "");
  const weak = checkNewPassword(password, checked.email);
  if (weak) return back(weak === "same" ? "passwordsame" : "password");
  if ((await recentCodes(checked.email, Date.now())) >= 5) return back("busy");
  try {
    const details = { ...checked.details, passwordHash: await hashPassword(password) };
    return seeOther(req, `/list-your-sites/confirm/?t=${await startCode(checked.email, details)}`);
  } catch {
    return back("send");
  }
}
