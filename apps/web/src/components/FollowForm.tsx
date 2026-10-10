import { Button } from "@ohworks/ui";

export interface FollowFormProps {
  city?: string | undefined;
  format?: string | undefined;
  query?: string | undefined;
  /** Where to return after submitting. */
  returnTo: string;
  what: string;
  /** The search to watch, as its address, when the buyer is following a search that already has results. */
  search?: string | undefined;
  /** The words on the button. */
  label?: string | undefined;
}

/** A plain form: works without JavaScript, posts to /api/follow, comes back with a message. */
export function FollowForm({
  city,
  format,
  query,
  returnTo,
  what,
  search,
  label,
}: FollowFormProps) {
  return (
    <form
      method="post"
      action="/api/follow/"
      className="mt-4 flex w-full max-w-[520px] flex-col gap-2 sm:flex-row"
      data-section="follow"
    >
      <input type="hidden" name="city" value={city ?? ""} />
      <input type="hidden" name="format" value={format ?? ""} />
      <input type="hidden" name="q" value={query ?? ""} />
      <input type="hidden" name="return" value={returnTo} />
      {search ? <input type="hidden" name="search" value={search} /> : null}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />
      <label htmlFor="follow-email" className="sr-only">
        Your email
      </label>
      <input
        id="follow-email"
        name="email"
        type="email"
        required
        placeholder="you@company.com"
        className="oh-input flex-1"
        autoComplete="email"
      />
      <Button variant="primary" type="submit">
        {label ?? `Tell me when ${what} are listed`}
      </Button>
    </form>
  );
}
