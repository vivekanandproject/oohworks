import type { Metadata } from "next";
import { Button, Container, NEUTRALITY_LINE } from "@ohworks/ui";
import { NativeSelect } from "@/components/NativeSelect";
import { Shell } from "@/components/Shell";
import { Notice } from "@/components/owners/Bits";
import {
  Aside,
  Card,
  FORM_GRID,
  FormSection,
  PageHead,
  StepsCard,
} from "@/components/owners/Frame";
import { OTHER_CITY } from "@/lib/owners/company-input";
import { ownerByEmail, ownerEmail } from "@/lib/owners/server";
import { alternates } from "@/lib/seo";
import { maskEmail } from "@/lib/sites/enquiry";
import { CITIES } from "@/lib/sites/taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "List your billboards, hoardings and screens free",
  description:
    "Put your outdoor advertising sites on ohworks at no cost. You set the price and how it shows, and every enquiry comes straight to you. Add sites one at a time, from a spreadsheet, or send us your media kit.",
  alternates: alternates("/list-your-sites/"),
};

/** Each mistake names the field it belongs to, so the page can mark that field and lead to it. */
const ERRORS: Record<string, { t: string; d: string; field?: keyof typeof FIELD_ID }> = {
  name: {
    t: "Add your company name.",
    d: "It is shown to buyers as the owner and seller.",
    field: "name",
  },
  city: {
    t: "Choose your city.",
    d: "Pick “Another city” if yours is not in the list.",
    field: "city",
  },
  contact: { t: "Add your own name.", d: "It is for our team only.", field: "contactName" },
  phone: {
    t: "Check the phone number.",
    d: "Use digits, with the country code if you like, such as +91 98450 00000.",
    field: "phone",
  },
  email: {
    t: "That email did not look right.",
    d: "It is where enquiries will be sent, so check it and try again.",
    field: "email",
  },
  gstin: {
    t: "That GSTIN is not right.",
    d: "It has 15 characters and its last one must add up. Check it against your certificate, or leave it empty for now.",
    field: "gstin",
  },
  busy: { t: "Too many tries in a short time.", d: "Wait a minute, then try again." },
  send: { t: "We could not send the code just now.", d: "Try again in a minute." },
  again: { t: "That code can no longer be used.", d: "Send the form again for a new one." },
};

const FIELD_ID = {
  name: "lys-name",
  city: "lys-city",
  contactName: "lys-contact",
  phone: "lys-phone",
  email: "owner-email",
  gstin: "lys-gstin",
} as const;

const WAYS = [
  {
    tag: "A few sites",
    title: "One at a time",
    text: "A short form and a pin on the map. About three minutes a site.",
  },
  {
    tag: "Many sites",
    title: "A spreadsheet",
    text: "Fill our template, one row a site, and upload it. Any problem is named by its row and column.",
  },
  {
    tag: "We do it",
    title: "Send us your media kit",
    text: "A PDF or your own sheet. Our team enters the sites, and you approve each one.",
  },
];

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export default async function ListYourSitesPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const q = await searchParams;
  const email = await ownerEmail();
  const owner = email ? await ownerByEmail(email) : null;
  const error = ERRORS[one(q.error)];
  // After a mistake the form comes back holding what was typed.
  const typed = (key: string, max: number): string => one(q[key]).slice(0, max);
  const wrong = (field: string) => (error?.field === field ? true : undefined);
  // The same words sit under the field itself, so the mistake is named where it is.
  const why = (field: string) =>
    error?.field === field ? (
      <p className="t-small text-critical mt-1 font-medium" data-section="field-error">
        {error.t}
      </p>
    ) : null;

  return (
    <Shell active="owners" listHref={email ? undefined : "#lys-name"}>
      <Container className="py-8 lg:py-12">
        <div className={FORM_GRID}>
          <div className="min-w-0">
            <PageHead eyebrow="List your sites · step 1 of 4" title="List your sites. It is free.">
              Tell us who is listing. Every enquiry then comes straight to you, at the price you
              set. ohworks never sells media or takes a margin.
            </PageHead>

            {one(q.out) === "1" ? (
              <div className="mt-5">
                <Notice tone="success" title="You are signed out." section="signed-out">
                  Your sites are untouched.{" "}
                  <a href="/sign-in/" className="oh-link">
                    Sign in
                  </a>{" "}
                  to come back to them.
                </Notice>
              </div>
            ) : null}
            {error ? (
              <div className="mt-5">
                <Notice tone="error" title={error.t} section="start-error">
                  {error.d}
                  {error.field ? (
                    <>
                      {" "}
                      <a href={`#${FIELD_ID[error.field]}`} className="oh-link">
                        Go to it
                      </a>
                      .
                    </>
                  ) : null}
                </Notice>
              </div>
            ) : null}

            {email ? (
              <div className="mt-6" data-section="start-known">
                <Card title={owner ? `Welcome back, ${owner.name}` : "Carry on where you left off"}>
                  <p className="t-body text-ink-muted">
                    This browser has confirmed{" "}
                    <span className="text-ink font-mono">{maskEmail(email)}</span>.
                  </p>
                  <div className="mt-4">
                    <Button
                      href={owner ? "/owner/" : "/owner/company/"}
                      variant="primary"
                      size="lg"
                    >
                      {owner ? "Go to your sites" : "Add your company"}
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <form
                method="post"
                action="/api/owner/start/"
                className="mt-6 flex flex-col gap-5"
                data-section="start-form"
              >
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="sr-only"
                />

                <div>
                  <label htmlFor="lys-name" className="oh-label block">
                    Company name
                  </label>
                  <input
                    id="lys-name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    defaultValue={typed("name", 80)}
                    autoComplete="organization"
                    aria-describedby="lys-name-help"
                    aria-invalid={wrong("name")}
                    // The bar's "List your sites" points here. The margin keeps the headline in
                    // view when it does, so the page answers by focusing the box.
                    className="oh-input mt-1 scroll-mt-[60vh]"
                  />
                  {why("name")}
                  <p id="lys-name-help" className="t-small text-ink-muted mt-1">
                    Shown to buyers as the owner and seller.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lys-city" className="oh-label block">
                      City
                    </label>
                    <NativeSelect
                      id="lys-city"
                      name="city"
                      required
                      value={typed("city", 20)}
                      placeholder="Choose…"
                      options={[
                        ...CITIES.map((c) => ({ value: c.slug, label: c.label })),
                        { value: OTHER_CITY, label: "Another city" },
                      ]}
                      aria-invalid={wrong("city")}
                      className="oh-input mt-1 scroll-mt-10"
                    />
                    {why("city")}
                  </div>
                  <div>
                    <label htmlFor="lys-contact" className="oh-label block">
                      Your name
                    </label>
                    <input
                      id="lys-contact"
                      name="contactName"
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      defaultValue={typed("contactName", 80)}
                      autoComplete="name"
                      aria-invalid={wrong("contactName")}
                      className="oh-input mt-1 scroll-mt-10"
                    />
                    {why("contactName")}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="lys-phone" className="oh-label block">
                      Phone
                    </label>
                    <input
                      id="lys-phone"
                      name="phone"
                      type="tel"
                      required
                      maxLength={24}
                      defaultValue={typed("phone", 24)}
                      autoComplete="tel"
                      placeholder="+91"
                      aria-describedby="lys-phone-help"
                      aria-invalid={wrong("phone")}
                      className="oh-input data mt-1 scroll-mt-10"
                    />
                    {why("phone")}
                    <p id="lys-phone-help" className="t-small text-ink-muted mt-1">
                      Shown to a buyer only when they ask to see it.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="owner-email" className="oh-label block">
                      Work email
                    </label>
                    <input
                      id="owner-email"
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      defaultValue={typed("email", 254)}
                      autoComplete="email"
                      placeholder="you@yourcompany.com"
                      aria-describedby="owner-email-help"
                      aria-invalid={wrong("email")}
                      className="oh-input mt-1 scroll-mt-10"
                    />
                    {why("email")}
                    <p id="owner-email-help" className="t-small text-ink-muted mt-1">
                      Enquiries are sent here. We confirm it with a code. Never shown on the site.
                    </p>
                  </div>
                </div>

                <FormSection
                  title="For the Verified owner badge"
                  part="badge"
                  note="Optional now. Our team checks the number against your GST certificate, which you add after this step. Neither is ever shown."
                >
                  <div className="sm:max-w-[calc(50%-8px)]">
                    <label htmlFor="lys-gstin" className="oh-label block">
                      GSTIN, optional
                    </label>
                    <input
                      id="lys-gstin"
                      name="gstin"
                      type="text"
                      maxLength={24}
                      defaultValue={typed("gstin", 24)}
                      placeholder="29ABCDE1234F1Z5"
                      autoCapitalize="characters"
                      aria-invalid={wrong("gstin")}
                      className="oh-input data mt-1 scroll-mt-10"
                    />
                    {why("gstin")}
                  </div>
                </FormSection>

                <div>
                  <button
                    type="submit"
                    className="oh-btn primary lg w-full sm:w-auto"
                    data-action="start"
                  >
                    Save and send my code
                  </button>
                  <p className="t-small text-ink-muted mt-3">
                    No password to remember. Already listed?{" "}
                    <a href="/sign-in/" className="oh-link">
                      Sign in
                    </a>
                    .
                  </p>
                </div>
              </form>
            )}
          </div>

          <Aside label="How listing works">
            <StepsCard at={1} />
            <Card title="For each site, have ready" section="needs">
              <ul className="t-body text-ink list-disc space-y-1 pl-5">
                <li>Where it is, and which way it faces</li>
                <li>Its size and how it is lit</li>
                <li>Your rate, or a choice to show &ldquo;price on request&rdquo;</li>
                <li>Real photographs, if you have them</li>
              </ul>
            </Card>
            <p className="t-small text-ink-muted">
              Listing costs nothing and there is no commission. {NEUTRALITY_LINE}{" "}
              <a href="/charter/" className="oh-link">
                Read what we never do
              </a>
              .
            </p>
          </Aside>
        </div>

        <section className="border-hairline mt-12 border-t pt-8">
          <h2 className="t-display-sm">Three ways to add your sites</h2>
          <p className="t-body text-ink-muted mt-1">
            You choose after this step, and you can mix them.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3" data-section="ways">
            {WAYS.map((w) => (
              <div key={w.title} className="border-hairline bg-paper-raised rounded-md border p-5">
                <span className="oh-badge neutral">{w.tag}</span>
                <h3 className="mt-3 text-[16px] leading-[22px] font-semibold">{w.title}</h3>
                <p className="t-body text-ink-muted mt-2">{w.text}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </Shell>
  );
}
