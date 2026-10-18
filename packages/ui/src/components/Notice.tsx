import type { ReactNode } from "react";

/**
 * What just happened, or what went wrong, said once near where it happened: a coloured dot and its
 * word (the state never rests on colour alone), a title, and a line on what to do next. An error is
 * announced at once; anything else is announced politely.
 */
export function Notice({
  tone,
  title,
  children,
  section,
  className = "",
}: {
  tone: "success" | "error" | "warning";
  title: ReactNode;
  children?: ReactNode;
  /** The data-section a test or a script finds it by. */
  section?: string;
  /** Spacing from what is around it. */
  className?: string;
}) {
  return (
    <div
      className={`oh-toast ${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
      data-section={section}
    >
      <span className="dot" />
      <div>
        <div className="t">{title}</div>
        {children ? <div className="d">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * A short note that something on the page is not what it seems: a sample, a preview, a code shown
 * on a development machine. Amber, small, and always with its own words.
 */
export function Note({
  children,
  section,
  className = "",
}: {
  children: ReactNode;
  section?: string;
  className?: string;
}) {
  return (
    <p className={`oh-note ${className}`.trim()} data-section={section}>
      {children}
    </p>
  );
}
