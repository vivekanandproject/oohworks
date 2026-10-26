export interface WordmarkProps {
  onDark?: boolean;
  /** Reference height in px; the name scales with it. */
  size?: number;
  className?: string;
}

/** The name alone, as live text in Poppins 700. The mark (Mark.tsx) stays for site plates; the favicon is the letters OH. */
export function Wordmark({ onDark = false, size = 32, className }: WordmarkProps) {
  return (
    <span
      className={`font-display inline-flex items-center leading-none ${className ?? ""}`}
      style={{
        color: onDark ? "var(--color-on-navy)" : "var(--color-navy)",
        // The name is in capitals, so on a narrow phone it gives up a little size before the bar overflows.
        fontSize: `min(${Math.round(size * 0.78)}px, 4.6vw)`,
        fontWeight: 700,
        letterSpacing: "-0.01em",
      }}
    >
      OOHWORKS
    </span>
  );
}
