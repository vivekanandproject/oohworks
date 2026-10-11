import { cleanEmail } from "@/lib/forms";
import { checkCompany, type CompanyRaw } from "@/lib/owners/company-input";
import { fileOf, go, ownerGate, text } from "@/lib/owners/request";
import { saveCompany, saveOwnerFile } from "@/lib/owners/server";

export const dynamic = "force-dynamic";

/** Who is listing: the company buyers will see as the seller, and where its enquiries go. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "company");
  if (!gate.ok) return gate.response;
  const { form, email } = gate;
  const raw: CompanyRaw = {
    name: text(form, "name", 80),
    placeLabel: text(form, "placeLabel", 160),
    placeId: text(form, "placeId", 300),
    placeLat: text(form, "placeLat", 24),
    placeLng: text(form, "placeLng", 24),
    placeCountry: text(form, "placeCountry", 2),
    contactName: text(form, "contactName", 80),
    phoneCountry: text(form, "phoneCountry", 2),
    phone: text(form, "phone", 32),
    gstin: text(form, "gstin", 40),
  };
  const about = text(form, "about", 600) || null;
  // A mistake returns to the form with everything that was typed.
  const back = (error: string) =>
    go(`/owner/company/?${new URLSearchParams({ error, ...raw }).toString()}`);
  const checked = checkCompany(raw);
  if (!checked.ok && checked.error !== "gstin" && checked.error !== "regno")
    return back(checked.error);
  const contactEmail =
    text(form, "contactEmail", 254) === "" ? email : cleanEmail(form.get("contactEmail"));
  if (!contactEmail) return back("email");
  if (!checked.ok) return back(checked.error);
  const doc = fileOf(form, "document", "document");
  if ("problem" in doc && doc.problem !== "missing")
    return back(doc.problem === "big" ? "filebig" : "filetype");

  const owner = await saveCompany(email, { ...checked.details, contactEmail, about });
  if ("file" in doc) {
    try {
      await saveOwnerFile(owner, doc.file, "document", "For verification");
    } catch {
      // The details are saved. Only the file was refused, most often a PDF that is damaged.
      return go("/owner/company/?error=fileread");
    }
  }
  return go("/owner/?saved=company");
}
