import type { ReactNode } from "react";

/** Content column: 1200px max (max-w-content), 16px gutters on phones, 40px on desktop. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`max-w-content mx-auto w-full px-4 lg:px-10 ${className ?? ""}`}>
      {children}
    </div>
  );
}
