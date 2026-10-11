import type { Metadata } from "next";
import { headers } from "next/headers";
import { Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { PhoneField } from "@/components/PhoneField";
import { PlaceField } from "@/components/PlaceField";
import { Notice, OwnerBar } from "@/components/owners/Bits";
import { Aside, Card, FORM_GRID, FormSection, PageHead } from "@/components/owners/Frame";
import { ownerFiles, requireEmail } from "@/lib/owners/server";
import { maskEmail } from "@/lib/sites/enquiry";
import { countryOf, splitPhone } from "@/lib/phone";
import { cityDef } from "@/lib/sites/taxonomy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your company",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, { t: string; d: string }> = {
  name: { t: "Add your company name.", d: "It is shown to buyers as the owner and seller." },
  contact: { t: "Add your own name.", d: "It is for our team only." },
  place: {
    t: "Say where your company is based.",
    d: "Start typing your city and choose it from the list, or type it in full.",
  },
  phone: {
    t: "Check the phone number.",
    d: "Choose the country, then type the number as you write it there.",
  },
  regno: {
    t: "That registration number did not look right.",
    d: "Use the number on your trade licence or registration, or leave it empty for now.",
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
  // A saved number is shown as its country and the part written after it.
  const savedPhone = splitPhone(owner?.phone, owner?.phoneCountry);
  const phoneCountry = one(q.error)
    ? one(q.phoneCountry)
    : owner?.phone
      ? savedPhone.country
      : countryOf(await headers());

  return (
    <Shell active="owners">
      <Container className="py-8 lg:py-12">
        {owner ? (
          <OwnerBar name={owner.name} email={maskEmail(email)} here="company" />
        ) : (
          // Before the company exists there is no owner's bar, so the way out is offered here.
          <form
            method="post"
            action="/api/owner/signout/"
            className="border-hairline t-small text-ink-muted flex flex-wrap items-center justify-end gap-3 border-b pb-4"
            data-section="confirmed-as"
          >
            <span>
              Confirmed as <span className="font-mono">{maskEmail(email)}</span>
            </span>
            <button type="submit" className="oh-link cursor-pointer">
              Not you? Sign out
            </button>
          </form>
        )}
        <div className={`mt-6 ${FORM_GRID}`}>
          <div className="min-w-0">
            <PageHead
              eyebrow={owner ? "Company details" : "List your sites · your details"}
              title={owner ? owner.name : "Who is listing"}
            >
              Buyers see the company as the owner and seller of every site. Nothing else here is
              shown without your say.
            </PageHead>
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
              <div>
                <label htmlFor="co-place" className="oh-label block">
                  Where the company is based
                </label>
                <PlaceField
                  id="co-place"
                  name="place"
                  scope="city"
                  required
                  defaultLabel={v(
                    "placeLabel",
                    owner?.location?.label ?? cityDef(owner?.city)?.label,
                  )}
                  defaults={{
                    id: v("placeId", owner?.location?.placeId),
                    lat: v("placeLat", ""),
                    lng: v("placeLng", ""),
                    country: v("placeCountry", owner?.location?.country),
                  }}
                  placeholder="Start typing your city"
                  describedBy="co-place-help"
                  phone={{ countryId: "co-phone-country", numberId: "co-phone" }}
                />
                <p id="co-place-help" className="t-small text-ink-muted mt-1">
                  Any city in the world. Choose it from the list as you type.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                <label htmlFor="co-phone" className="oh-label block">
                  Phone
                </label>
                <PhoneField
                  id="co-phone"
                  country={phoneCountry}
                  number={v("phone", savedPhone.national)}
                  required
                  describedBy="co-phone-help"
                />
                <p id="co-phone-help" className="t-small text-ink-muted mt-1">
                  Choose the country, then the number as you write it there. Shown to a buyer only
                  when they ask to see it.
                </p>
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

              <FormSection
                title="For the Verified owner badge"
                part="badge"
                note="Optional now. Our team checks the number against the document. Neither is ever shown, and only our team can open the file."
              >
                {owner?.verified ? (
                  <p>
                    <span className="oh-badge verified">Verified owner</span>
                  </p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="co-gstin" className="oh-label block">
                      GSTIN or licence number
                    </label>
                    <input
                      id="co-gstin"
                      name="gstin"
                      type="text"
                      maxLength={40}
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
              </FormSection>

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

          <Aside label="About these details">
            <Card title="Who sees what" section="who-sees">
              <dl className="t-body flex flex-col gap-3">
                <div>
                  <dt className="font-semibold">Company name</dt>
                  <dd className="text-ink-muted">Shown on every site you list.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd className="text-ink-muted">Shown to a buyer only when they ask to see it.</dd>
                </div>
                <div>
                  <dt className="font-semibold">Email, your name, GSTIN and document</dt>
                  <dd className="text-ink-muted">Never shown. They are for our team.</dd>
                </div>
              </dl>
            </Card>
            <Card title="The Verified owner badge" section="badge-help">
              <p className="t-body text-ink-muted">
                Buyers trust a site more when its owner is checked. Add your GSTIN and its
                certificate, or a trade licence, and our team compares them, usually within a
                working day.
              </p>
            </Card>
          </Aside>
        </div>
      </Container>
    </Shell>
  );
}
