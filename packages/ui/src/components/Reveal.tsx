"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface RevealProps {
  children: ReactNode;
  /** "fade": the block fades up when it enters view. "draw": the block stays visible and its SVG strokes draw in. */
  mode?: "fade" | "draw";
  /** Children carrying a `--i` custom property animate in sequence instead of the block as a whole. */
  stagger?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Marks a block visible once it enters the viewport. The hidden state lives in CSS and is lifted
 * by a noscript rule and by prefers-reduced-motion, so nothing depends on this script to be seen.
 */
export function Reveal({
  children,
  mode = "fade",
  stagger = false,
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute("data-reveal", "visible");
    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal="pending"
      data-reveal-mode={mode}
      data-stagger={stagger ? "" : undefined}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
