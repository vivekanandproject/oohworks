import type { ReactNode } from "react";

/** Content column: 1200px max, 16px gutters on phones, 40px on desktop. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 lg:px-10 ${className ?? ""}`}>
      {children}
    </div>
  );
}
