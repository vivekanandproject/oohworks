"use client";

import { useState } from "react";

/**
 * A password box with a way to see what was typed. It is an ordinary password box first: the
 * "Show" button only does anything once the page's script has woken.
 */
export function PasswordField({
  id,
  name = "password",
  fresh,
  required,
  invalid,
  describedBy,
  focus,
}: {
  id: string;
  name?: string;
  /** A new password being chosen, so the browser offers to make and keep one. */
  fresh?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /** Put the cursor here when the page opens. */
  focus?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative mt-1">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        required={required}
        {...(fresh ? { minLength: 8 } : {})}
        maxLength={128}
        autoComplete={fresh ? "new-password" : "current-password"}
        autoCapitalize="none"
        spellCheck={false}
        autoFocus={focus}
        aria-describedby={describedBy}
        aria-invalid={invalid ? true : undefined}
        className="oh-input scroll-mt-10 pr-[68px]"
      />
      <button
        type="button"
        className="text-navy-700 absolute top-0 right-0 h-full rounded-sm px-3 text-[13px] leading-none font-semibold"
        aria-pressed={shown}
        aria-controls={id}
        onClick={() => setShown((s) => !s)}
      >
        {shown ? "Hide" : "Show"}
        <span className="sr-only"> password</span>
      </button>
    </div>
  );
}
