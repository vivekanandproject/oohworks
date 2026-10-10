import type { ListName } from "@/lib/sites/lists";

export const TOGGLE_WORDS: Record<ListName, readonly [string, string]> = {
  saved: ["Save", "Saved"],
  compare: ["Compare", "Comparing"],
};

/**
 * Saves a site to the shortlist, or ticks it for comparing. A plain form, so it works without script;
 * with script the page stays where it is. The word and the pressed state change together.
 */
export function ListToggle({
  list,
  id,
  title,
  on,
  back,
  className = "oh-btn secondary sm",
}: {
  list: ListName;
  id: string;
  /** The site's name, read out after the word so each button can be told apart. */
  title: string;
  on: boolean;
  /** Where a browser without script returns to. */
  back: string;
  className?: string;
}) {
  return (
    <form method="post" action="/api/lists/" data-list-form={list} data-id={id}>
      <input type="hidden" name="list" value={list} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="return" value={back} />
      <button type="submit" className={`oh-toggle ${className}`} aria-pressed={on}>
        <span data-label="">{TOGGLE_WORDS[list][on ? 1 : 0]}</span>
        <span className="sr-only">: {title}</span>
      </button>
    </form>
  );
}
