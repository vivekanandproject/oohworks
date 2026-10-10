import type { SelectHTMLAttributes } from "react";

const esc = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A drop-down whose chosen option belongs to the browser, not to script. The options are written as
 * plain markup with one marked "selected", so a choice made while the page is still loading is kept.
 * Given a value to manage instead, the page's script would set the drop-down back to its starting
 * option when it finished loading, and the visitor's choice would be lost without a word.
 */
export function NativeSelect({
  value,
  options,
  placeholder,
  ...rest
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
} & Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "defaultValue" | "children" | "dangerouslySetInnerHTML"
>) {
  const all = placeholder === undefined ? options : [{ value: "", label: placeholder }, ...options];
  const html = all
    .map(
      (o) =>
        `<option value="${esc(o.value)}"${o.value === value ? " selected" : ""}>${esc(o.label)}</option>`,
    )
    .join("");
  return <select {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}
