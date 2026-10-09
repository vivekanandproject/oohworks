import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons/Icon";

export function EmptyState({
  icon,
  title,
  children,
  actions,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="oh-empty">
      <span className="text-ink-muted">
        <Icon name={icon} size={32} />
      </span>
      <div className="t">{title}</div>
      <p>{children}</p>
      {actions ? <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
