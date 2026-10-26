import { Icon, type IconName } from "../icons/Icon";

export type BadgeKind =
  | "verified"
  | "permit"
  | "fresh"
  | "responsive"
  | "booked"
  | "pending"
  | "critical"
  | "featured"
  | "neutral";

const ICON_FOR: Partial<Record<BadgeKind, IconName>> = {
  verified: "verified",
  permit: "permit",
  fresh: "fresh",
  responsive: "responsive",
};

/**
 * States what OOHWORKS checked and when. Every badge carries its word; verification badges also carry
 * their icon. A state that only borrows a badge's colour (free dates, a live site) leaves it out.
 */
export function Badge({
  kind,
  children,
  icon: withIcon = true,
  className,
  ...rest
}: {
  kind: BadgeKind;
  children: React.ReactNode;
  icon?: boolean;
  className?: string | undefined;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "children" | "className">) {
  const icon = withIcon ? ICON_FOR[kind] : undefined;
  return (
    <span className={["oh-badge", kind, className ?? ""].filter(Boolean).join(" ")} {...rest}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </span>
  );
}
