import type { InputHTMLAttributes, ReactNode } from "react";

/** One choice in a group: a 44px row, the circle in navy, the label beside it. */
export function Radio({
  label,
  ...input
}: { label: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label className="t-body flex min-h-11 cursor-pointer items-center gap-2">
      <input type="radio" className="accent-navy h-[18px] w-[18px]" {...input} />
      {label}
    </label>
  );
}
