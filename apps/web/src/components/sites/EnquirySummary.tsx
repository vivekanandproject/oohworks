import { NEUTRALITY_LINE, Note } from "@ohworks/ui";
import type { Owner, Site } from "@/payload-types";
import { availabilityOf, metaLine, priceOf, siteUrl } from "@/lib/sites/view";
import { AvailabilityChip } from "./SiteCard";

/** The site an enquiry is about, and who it goes to. */
export function EnquirySummary({
  site,
  owner,
  now,
}: {
  site: Site;
  owner: Owner | null;
  now: number;
}) {
  const price = priceOf(site);
  return (
    <aside
      className="border-hairline bg-paper-raised rounded-md border p-5"
      aria-label="The site you are asking about"
      data-section="enquiry-summary"
    >
      <p className="t-label text-ink-muted">You are asking about</p>
      <p className="t-title mt-2">
        <a href={siteUrl(site)} className="oh-link">
          {site.title}
        </a>
      </p>
      <p className="t-small text-ink-muted mt-1">{metaLine(site)}</p>
      <p className="t-price mt-3" style={{ fontVariantNumeric: "tabular-nums" }}>
        {price.shown ? (
          <>
            {price.prefix}
            {price.amount}{" "}
            <span className="t-small text-ink-muted font-sans font-normal">/ month</span>
          </>
        ) : (
          <span className="text-[16px]">Price on request</span>
        )}
      </p>
      <div className="mt-2">
        <AvailabilityChip availability={availabilityOf(site, now)} />
      </div>
      {site.sample ? (
        <Note className="mt-3">
          A sample listing. Its owner is not real, so nothing leaves this machine.
        </Note>
      ) : null}
      <p className="t-small border-hairline text-ink-muted mt-4 border-t pt-4">
        {owner ? `Goes straight to ${owner.name}. ` : ""}
        {NEUTRALITY_LINE}
      </p>
    </aside>
  );
}
