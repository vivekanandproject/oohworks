import { Icon, type IconName } from "../icons/Icon";

export type BadgeKind =
  "verified" | "permit" | "fresh" | "responsive" | "booked" | "critical" | "featured" | "neutral";

const ICON_FOR: Partial<Record<BadgeKind, IconName>> = {
  verified: "verified",
  permit: "permit",
  fresh: "fresh",
  responsive: "responsive",
};

/** States what OOHWORKS checked and when. Every badge carries its word; verification badges also carry their icon. */
export function Badge({ kind, children }: { kind: BadgeKind; children: React.ReactNode }) {
  const icon = ICON_FOR[kind];
  return (
    <span className={`oh-badge ${kind}`}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </span>
  );
}
