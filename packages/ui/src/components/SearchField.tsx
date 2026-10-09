import { Icon } from "../icons/Icon";

export interface SearchFieldProps {
  action?: string;
  placeholder?: string;
  label?: string;
  buttonLabel?: string;
  defaultValue?: string;
  /** Large hero variant: 56px tall. */
  size?: "md" | "lg";
}

/**
 * A plain GET form: works with no JavaScript, submits to the search page.
 * The submit button is the one `survey` element on the page that uses it.
 */
export function SearchField({
  action = "/search/",
  placeholder = "Try: hoarding on Outer Ring Road, Bengaluru",
  label = "Search sites by place, road, format or size",
  buttonLabel = "Find sites",
  defaultValue,
  size = "lg",
}: SearchFieldProps) {
  const lg = size === "lg";
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex w-full flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="q" className="sr-only">
        {label}
      </label>
      <div className="relative flex-1">
        <span className="text-ink-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
          <Icon name="pin" size={20} />
        </span>
        <input
          id="q"
          name="q"
          type="search"
          className={`oh-input ${lg ? "lg" : ""} pl-12!`}
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>
      <button type="submit" className={`oh-btn accent ${lg ? "lg" : ""}`}>
        {buttonLabel}
      </button>
    </form>
  );
}
