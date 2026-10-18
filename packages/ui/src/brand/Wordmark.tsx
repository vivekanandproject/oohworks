import { Mark } from "./Mark";

export interface WordmarkProps {
  onDark?: boolean;
  /** Mark height in px; the name scales with it. */
  size?: number;
  className?: string;
}

/** Horizontal lock-up: the mark, then the name as live text in Bricolage Grotesque 700. */
export function Wordmark({ onDark = false, size = 32, className }: WordmarkProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      style={{ color: onDark ? "var(--color-on-navy)" : "var(--color-navy)" }}
    >
      <Mark size={size} onDark={onDark} />
      <span
        className="font-display leading-none max-[379px]:sr-only"
        style={{
          // The name is in capitals, so on a narrow phone it gives up a little size before the bar overflows.
          fontSize: `min(${Math.round(size * 0.78)}px, 4.8vw)`,
          fontWeight: 800,
          fontStretch: "106%",
          fontVariationSettings: '"wdth" 106',
          letterSpacing: "-0.03em",
        }}
      >
        OOHWORKS
      </span>
    </span>
  );
}
