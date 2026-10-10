import { cleanEmail } from "@/lib/forms";
import { PHONE } from "@/lib/owners/company-input";
import { isGstin, tidyGstin } from "@/lib/owners/gstin";
import { fileOf, go, ownerGate, text } from "@/lib/owners/request";
import { saveCompany, saveOwnerFile } from "@/lib/owners/server";
import { CITIES, type CitySlug } from "@/lib/sites/taxonomy";

export const dynamic = "force-dynamic";

/** Who is listing: the company buyers will see as the seller, and where its enquiries go. */
export async function POST(req: Request) {
  const gate = await ownerGate(req, "company");
  if (!gate.ok) return gate.response;
  const { form, email } = gate;
  const name = text(form, "name", 80);
  const contactName = text(form, "contactName", 80);
  const phone = text(form, "phone", 24);
  const cityRaw = text(form, "city", 20);
  const city = (CITIES.find((c) => c.slug === cityRaw)?.slug ?? null) as CitySlug | null;
  const gstinRaw = text(form, "gstin", 24);
  const about = text(form, "about", 600) || null;
  const back = (error: string) => {
    const q = new URLSearchParams({
      error,
      name,
      contactName,
      phone,
      city: cityRaw,
      gstin: gstinRaw,
    });
    return go(`/owner/company/?${q.toString()}`);
  };
  if (name.length < 2) return back("name");
  if (contactName.length < 2) return back("contact");
  if (!PHONE.test(phone)) return back("phone");
  const contactEmail =
    text(form, "contactEmail", 254) === "" ? email : cleanEmail(form.get("contactEmail"));
  if (!contactEmail) return back("email");
  if (gstinRaw && !isGstin(gstinRaw)) return back("gstin");
  const doc = fileOf(form, "document", "document");
  if ("problem" in doc && doc.problem !== "missing")
    return back(doc.problem === "big" ? "filebig" : "filetype");

  const owner = await saveCompany(email, {
    name,
    city,
    contactName,
    phone,
    contactEmail,
    about,
    gstin: gstinRaw ? tidyGstin(gstinRaw) : null,
  });
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
