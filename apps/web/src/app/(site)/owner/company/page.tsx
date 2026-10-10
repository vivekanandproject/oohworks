import type { Metadata } from "next";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { NativeSelect } from "@/components/NativeSelect";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { ownerFiles, requireEmail } from "@/lib/owners/server";
import { maskEmail } from "@/lib/sites/enquiry";
import { CITIES } from "@/lib/sites/taxonomy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your company",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, { t: string; d: string }> = {
  name: { t: "Add your company name.", d: "It is shown to buyers as the owner and seller." },
  contact: { t: "Add your own name.", d: "It is for our team only." },
  phone: {
    t: "Check the phone number.",
    d: "Use digits, with the country code if you like, such as +91 98450 00000.",
  },
  email: { t: "That email did not look right.", d: "It is where enquiries will be sent." },
  gstin: {
    t: "That GSTIN is not right.",
    d: "It has 15 characters and its last one must add up. Check it against your certificate, or leave it empty for now.",
  },
  filebig: { t: "That file is too large.", d: "Use a file of 10 MB or less." },
  filetype: {
    t: "That kind of file cannot be used.",
    d: "Upload a PDF, or a JPEG, PNG or WebP image.",
  },
  fileread: {
    t: "Your details are saved, but we could not read that file.",
    d: "It may be damaged. Save it again as a PDF or an image and add it once more.",
  },
};

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function CompanyPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const { email, owner } = await requireEmail();
  const error = ERRORS[one(q.error)];
  const documents = owner ? await ownerFiles(owner.id, "document") : [];
  const v = (key: string, saved: string | null | undefined): string =>
    one(q.error) ? one(q[key]) : (saved ?? "");

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        {owner ? <OwnerBar name={owner.name} email={maskEmail(email)} here="company" /> : null}
        <div className="mt-6 max-w-[640px]">
          <p className="t-label text-ink-muted">
            {owner ? "Company details" : "List your sites · step 2 of 4"}
          </p>
          <h1 className="t-display-md mt-2">{owner ? owner.name : "Who is listing"}</h1>
          <p className="t-body text-ink-muted mt-2">
            Buyers see the company as the owner and seller of every site. Nothing else here is shown
            without your say.
          </p>
          {error ? (
            <div className="mt-5">
              <Notice tone="error" title={error.t} section="company-error">
                {error.d}
              </Notice>
            </div>
          ) : null}

          <form
            method="post"
            action="/api/owner/company/"
            encType="multipart/form-data"
            className="mt-6 flex flex-col gap-5"
            data-section="company-form"
          >
            <div>
              <label htmlFor="co-name" className="oh-label block">
                Company name
              </label>
              <input
                id="co-name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                defaultValue={v("name", owner?.name)}
                autoComplete="organization"
                aria-describedby="co-name-help"
                className="oh-input mt-1"
              />
              <p id="co-name-help" className="t-small text-ink-muted mt-1">
                Shown to buyers as the owner and seller.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="co-city" className="oh-label block">
                  City
                </label>
                <NativeSelect
                  id="co-city"
                  name="city"
                  value={v("city", owner?.city)}
                  placeholder="Choose…"
                  options={CITIES.map((c) => ({ value: c.slug, label: c.label }))}
                  className="oh-input mt-1"
                />
              </div>
              <div>
                <label htmlFor="co-contact" className="oh-label block">
                  Your name
                </label>
                <input
                  id="co-contact"
                  name="contactName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  defaultValue={v("contactName", owner?.contactName)}
                  autoComplete="name"
                  className="oh-input mt-1"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="co-phone" className="oh-label block">
                  Phone
                </label>
                <input
                  id="co-phone"
                  name="phone"
                  type="tel"
                  required
                  maxLength={24}
                  defaultValue={v("phone", owner?.phone)}
                  autoComplete="tel"
                  placeholder="+91"
                  aria-describedby="co-phone-help"
                  className="oh-input data mt-1"
                />
                <p id="co-phone-help" className="t-small text-ink-muted mt-1">
                  Shown to a buyer only when they ask to see it.
                </p>
              </div>
              <div>
                <label htmlFor="co-email" className="oh-label block">
                  Enquiries go to
                </label>
                <input
                  id="co-email"
                  name="contactEmail"
                  type="email"
                  maxLength={254}
                  defaultValue={owner?.contactEmail ?? email}
                  autoComplete="email"
                  aria-describedby="co-email-help"
                  className="oh-input mt-1"
                />
                <p id="co-email-help" className="t-small text-ink-muted mt-1">
                  Never shown on the site. Change it to a sales address if you like.
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="co-about" className="oh-label block">
                About the company, optional
              </label>
              <textarea
                id="co-about"
                name="about"
                rows={3}
                maxLength={600}
                defaultValue={owner?.about ?? ""}
                className="oh-input mt-1 block"
              />
            </div>

            <fieldset className="border-hairline bg-paper-raised rounded-md border p-5">
              <legend className="px-1 text-[16px] leading-[22px] font-semibold">
                For the Verified owner badge
              </legend>
              <p className="t-small text-ink-muted">
                Optional now. Our team checks the number against the document. Neither is ever
                shown, and only our team can open the file.
              </p>
              {owner?.verified ? <p className="oh-badge verified mt-3">Verified owner</p> : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-gstin" className="oh-label block">
                    GSTIN
                  </label>
                  <input
                    id="co-gstin"
                    name="gstin"
                    type="text"
                    maxLength={24}
                    defaultValue={v("gstin", owner?.gstin)}
                    placeholder="29ABCDE1234F1Z5"
                    autoCapitalize="characters"
                    className="oh-input data mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="co-doc" className="oh-label block">
                    GST certificate or trade licence
                  </label>
                  <input
                    id="co-doc"
                    name="document"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    aria-describedby="co-doc-help"
                    className="oh-input mt-1"
                  />
                  <p
                    id="co-doc-help"
                    className="t-small text-ink-muted mt-1"
                    data-section="documents-held"
                  >
                    PDF or image, up to 10 MB.
                    {documents.length
                      ? ` ${documents.length === 1 ? "One document is" : `${documents.length} documents are`} already with our team.`
                      : ""}
                  </p>
                </div>
              </div>
            </fieldset>

            <div>
              <button
                type="submit"
                className="oh-btn primary lg w-full sm:w-auto"
                data-action="save-company"
              >
                {owner ? "Save the details" : "Save and add sites"}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </Shell>
  );
}
