export interface MarkProps {
  size?: number;
  /** On the navy storefront band or over photos. */
  onDark?: boolean;
  className?: string;
}

/** The ohworks mark: a map pin whose head is a billboard face with a survey dot. Geometry from ohworks-mark.svg. */
export function Mark({ size = 32, onDark = false, className }: MarkProps) {
  const ink = onDark ? "#f6f5f2" : "#101c30";
  const dot = onDark ? "#ff8a5b" : "#e8561f";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={className}>
      <rect x="8" y="8" width="48" height="30" rx="4" fill={ink} />
      <rect x="29" y="38" width="6" height="14" fill={ink} />
      <rect x="22" y="52" width="20" height="4" rx="2" fill={ink} />
      <circle cx="32" cy="23" r="6" fill={dot} />
    </svg>
  );
}
