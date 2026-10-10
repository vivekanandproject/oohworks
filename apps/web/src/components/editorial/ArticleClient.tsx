"use client";

import { useEffect, useRef, useState } from "react";

/** A thin bar under the navigation that fills as the reader moves through the piece. */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    const node = bar.current;
    if (!target || !node) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const done = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : rect.top < 0 ? 1 : 0;
      node.style.transform = `scaleX(${done})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div
      className="bg-hairline sticky top-[65px] z-20 h-[3px]"
      aria-hidden="true"
      data-section="progress"
    >
      <div ref={bar} className="bg-navy h-full origin-left" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}

/** Marks the contents link of the section being read. Renders nothing itself. */
export function TocHighlight({ ids }: { ids: string[] }) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || ids.length === 0) return;
    const links = new Map<string, HTMLAnchorElement>();
    for (const id of ids) {
      const link = document.querySelector<HTMLAnchorElement>(
        `[data-toc] a[href="#${CSS.escape(id)}"]`,
      );
      if (link) links.set(id, link);
    }
    const mark = (current: string) => {
      for (const [id, link] of links) {
        if (id === current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    };
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) mark(first);
      },
      { rootMargin: "-96px 0px -60% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [ids]);
  return null;
}

/** Copies the page address. Says so in words, for screen readers too. */
export function CopyLink() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="oh-chip"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            window.location.href.split("#")[0] ?? window.location.href,
          );
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
    </button>
  );
}
